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
    user_lists = current_user.todo_lists  # direct relationship
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
    if todo_list.owner.id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    # If there's a parent, ensure it's valid and within depth
    if parent_id:
        parent_task = Task.query.get(parent_id)
        if not parent_task:
            return jsonify({"error": "Invalid parent_id"}), 400
        depth = get_task_depth(parent_task)
        if depth >= 3:
            return jsonify({"error": "Max depth (3) reached"}), 400

    new_task = Task(
        title=title,
        description=description,
        status=status,
        list_id=list_id,
        parent_id=parent_id
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
    todo_list = TodoList.query.get_or_404(list_id)
    if todo_list.owner.id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    top_tasks = Task.query.filter_by(list_id=list_id, parent_id=None).all()

    def serialize_task(task):
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
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
    # Check ownership
    if task.todo_list.owner.id != current_user.id:
        return jsonify({"error": "Not authorized"}), 403

    task.status = new_status
    db.session.commit()
    return jsonify({
        "message": "Status updated",
        "task_id": task.id,
        "new_status": new_status
    }), 200
