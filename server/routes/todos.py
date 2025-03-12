from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, TodoList, Task, get_task_depth

todos_bp = Blueprint('todos', __name__)

@todos_bp.route('/list', methods=['POST'])
@login_required
def create_list():
    """
    Create a new TodoList for the current user.
    Body: { "title": "My List" }
    """
    data = request.get_json()
    title = data.get('title')
    if not title:
        return jsonify({"error": "Missing title"}), 400

    # Check if a list with this name already exists for the user
    existing_list = TodoList.query.filter_by(user_id=current_user.id, title=title).first()
    if existing_list:
        return jsonify({"error": "A list with this name already exists"}), 409

    new_list = TodoList(title=title, user_id=current_user.id)
    db.session.add(new_list)
    db.session.commit()
    return jsonify({"message": "Todo list created", "list_id": new_list.id}), 201

@todos_bp.route('/lists', methods=['GET'])
@login_required
def get_lists_for_user():
    """
    Get all TodoLists for the logged-in user.
    Returns an array of {id, title}.
    """
    user_lists = TodoList.query.filter_by(user_id=current_user.id).all()
    output = []
    for lst in user_lists:
        output.append({
            "id": lst.id,
            "title": lst.title
        })
    return jsonify(output), 200

@todos_bp.route('/task', methods=['POST'])
@login_required
def add_task():
    """
    Create a new Task (or subtask).
    Body: {
      "title": "Task title",
      "description": "Task desc",
      "status": "Todo|In Progress|Done",
      "list_id": 123,
      "parent_id": optional
    }
    """
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    status = data.get('status', 'Todo')
    list_id = data.get('list_id')
    parent_id = data.get('parent_id')

    if not title:
        return jsonify({"error": "Missing title"}), 400

    # Validate the list belongs to current_user
    todo_list = TodoList.query.get_or_404(list_id)
    if todo_list.user_id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    # Check for duplicate task names at the same level
    if parent_id:
        # Check for duplicate subtask names under the same parent
        parent_task = Task.query.get_or_404(parent_id)
        existing_subtask = Task.query.filter_by(
            title=title,  # Changed from content to title
            parent_id=parent_id
        ).first()
        
        if existing_subtask:
            return jsonify({"error": "A subtask with this name already exists"}), 409
    else:
        # Check for duplicate top-level task names in the same list
        existing_task = Task.query.filter_by(
            title=title,  # Changed from content to title
            list_id=list_id, 
            parent_id=None
        ).first()
        
        if existing_task:
            return jsonify({"error": "A task with this name already exists in this list"}), 409

    # If there's a parent, ensure it's valid and within depth
    if parent_id:
        parent_task = Task.query.get(parent_id)
        if not parent_task:
            return jsonify({"error": "Invalid parent_id"}), 400
        depth = get_task_depth(parent_task)
        if depth >= 2:  # Max depth is 3 (0, 1, 2)
            return jsonify({"error": "Max depth (3) reached"}), 400

    new_task = Task(
        title=title,  # Changed from content to title
        description=description,  # Added description
        list_id=list_id,
        parent_id=parent_id,
        status=status
    )
    db.session.add(new_task)
    db.session.commit()

    return jsonify({"message": "Task added", "task_id": new_task.id}), 201

@todos_bp.route('/tasks/<int:list_id>', methods=['GET'])
@login_required
def get_tasks_for_list(list_id):
    """
    Get top-level tasks (and nested subtasks) for a given list_id.
    Only for tasks that belong to the current user.
    """
    todo_list = TodoList.query.filter_by(id=list_id, user_id=current_user.id).first()
    if not todo_list:
        return jsonify({"error": "List not found"}), 404

    top_tasks = Task.query.filter_by(list_id=list_id, parent_id=None).all()

    def serialize_task(task):
        return {
            "id": task.id,
            "title": task.title,  # Changed from content to title
            "description": task.description or "",  # Use the description field
            "status": task.status,
            "list_id": task.list_id,
            "subtasks": [serialize_task(sub) for sub in task.subtasks]
        }

    tasks_data = [serialize_task(task) for task in top_tasks]
    return jsonify(tasks_data), 200

@todos_bp.route('/task/<int:task_id>/status', methods=['PATCH'])
@login_required
def update_task_status(task_id):
    """
    Update the status of a Task.
    Body: { "status": "Todo|In Progress|Done" }
    """
    data = request.get_json()
    new_status = data.get('status')
    if new_status not in ['Todo', 'In Progress', 'Done']:
        return jsonify({"error": "Invalid status"}), 400

    task = Task.query.get_or_404(task_id)
    # Check ownership through the list
    todo_list = TodoList.query.get_or_404(task.list_id)
    if todo_list.user_id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    # Update the task status
    task.status = new_status
    db.session.commit()
    
    # If task is marked as Done, check if we need to update parent task
    if new_status == 'Done' and task.parent_id:
        parent_task = Task.query.get(task.parent_id)
        # Check if all siblings are also done
        all_siblings_done = all(sibling.status == 'Done' for sibling in parent_task.subtasks)
        
        # If all siblings are done, mark parent as done too
        if all_siblings_done and parent_task.status != 'Done':
            parent_task.status = 'Done'
            db.session.commit()
    
    return jsonify({
        "message": "Status updated",
        "task_id": task.id,
        "new_status": new_status
    }), 200

@todos_bp.route('/task/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    """
    Delete a task and all its subtasks.
    """
    task = Task.query.get_or_404(task_id)
    
    # Check ownership through the list
    todo_list = TodoList.query.get_or_404(task.list_id)
    if todo_list.user_id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403
    
    # Recursively delete all subtasks
    def delete_subtasks(task):
        for subtask in task.subtasks:
            delete_subtasks(subtask)
            db.session.delete(subtask)
    
    delete_subtasks(task)
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({"message": "Task deleted successfully"}), 200

@todos_bp.route('/task/<int:task_id>/move', methods=['PATCH'])
@login_required
def move_task(task_id):
    """
    Move a task to a different list and/or parent.
    Body: { 
        "list_id": 123,
        "parent_id": 456 or null
    }
    """
    data = request.get_json()
    new_list_id = data.get('list_id')
    new_parent_id = data.get('parent_id')
    
    if not new_list_id and new_parent_id is None:
        return jsonify({"error": "Missing list_id or parent_id"}), 400
    
    task = Task.query.get_or_404(task_id)
    
    # Check ownership of current list
    current_list = TodoList.query.get_or_404(task.list_id)
    if current_list.user_id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403
    
    # If moving to a different list
    if new_list_id and new_list_id != task.list_id:
        # Check ownership of new list
        new_list = TodoList.query.get_or_404(new_list_id)
        if new_list.user_id != current_user.id:
            return jsonify({"error": "Not authorized"}), 403
        
        # Update the list_id
        task.list_id = new_list_id
    
    # If changing parent
    if new_parent_id is not None:
        # If moving to be a top-level task
        if new_parent_id == 0 or new_parent_id == "":
            task.parent_id = None
        else:
            # Check if the new parent exists and is valid
            parent_task = Task.query.get_or_404(new_parent_id)
            
            # Check if the new parent is in the same list (or the new list if moving lists)
            list_id_to_check = new_list_id if new_list_id else task.list_id
            if parent_task.list_id != list_id_to_check:
                return jsonify({"error": "Parent task must be in the same list"}), 400
            
            # Check if the new parent is not the task itself or one of its descendants
            current_parent = parent_task
            while current_parent:
                if current_parent.id == task_id:
                    return jsonify({"error": "Cannot move a task to be a child of itself or its descendants"}), 400
                current_parent = current_parent.parent
            
            # Check depth limit
            depth = get_task_depth(parent_task)
            if depth >= 2:  # Max depth is 3 (0, 1, 2)
                return jsonify({"error": "Max depth (3) reached"}), 400
            
            # Update the parent_id
            task.parent_id = new_parent_id
    
    db.session.commit()
    
    return jsonify({
        "message": "Task moved successfully",
        "task_id": task.id,
        "new_list_id": task.list_id,
        "new_parent_id": task.parent_id
    }), 200