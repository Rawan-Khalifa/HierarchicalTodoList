from flask import Blueprint, request, jsonify
from models import db, TodoList, Task, User

todos_bp = Blueprint('todos', __name__)

# Create a new todo list
@todos_bp.route('/list', methods=['POST'])
def create_list():
    data = request.get_json()
    title = data.get('title')
    user_id = data.get('user_id')
    
    if not title or not user_id:
        return jsonify({"error": "Missing title or user_id"}), 400
    
    new_list = TodoList(title=title, user_id=user_id)
    db.session.add(new_list)
    db.session.commit()
    
    return jsonify({"message": "Todo list created", "list_id": new_list.id}), 201

# Add a task to a list (or as a subtask if parent_id is provided)
@todos_bp.route('/task', methods=['POST'])
def add_task():
    data = request.get_json()
    description = data.get('description')
    list_id = data.get('list_id')
    parent_id = data.get('parent_id')  # This is optional
    
    if not description or not list_id:
        return jsonify({"error": "Missing description or list_id"}), 400
    
    new_task = Task(description=description, list_id=list_id, parent_id=parent_id)
    db.session.add(new_task)
    db.session.commit()
    
    return jsonify({"message": "Task added", "task_id": new_task.id}), 201

# Get all todo lists for a user
@todos_bp.route('/lists/<int:user_id>', methods=['GET'])
def get_lists(user_id):
    lists = TodoList.query.filter_by(user_id=user_id).all()
    output = []
    for lst in lists:
        output.append({"id": lst.id, "title": lst.title})
    return jsonify(output), 200

# Get tasks for a specific list (including their hierarchy)
@todos_bp.route('/tasks/<int:list_id>', methods=['GET'])
def get_tasks(list_id):
    tasks = Task.query.filter_by(list_id=list_id, parent_id=None).all()
    
    def serialize_task(task):
        return {
            "id": task.id,
            "description": task.description,
            "completed": task.completed,
            "subtasks": [serialize_task(sub) for sub in task.subtasks]
        }
    
    return jsonify([serialize_task(task) for task in tasks]), 200
