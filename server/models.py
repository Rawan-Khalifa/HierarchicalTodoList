from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

def get_task_depth(task, depth=1):
    """
    Helper to check how deep a task is nested (for subtasks).
    """
    if not task.parent:
        return depth
    return get_task_depth(task.parent, depth + 1)

class User(db.Model, UserMixin):
    """
    Represents a user for authentication (Flask-Login).
    """
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    # Relationship: one user has many TodoLists
    todo_lists = db.relationship('TodoList', backref='owner', lazy=True)

class TodoList(db.Model):
    """
    A collection of tasks for a user.
    """
    __tablename__ = 'todo_lists'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # Relationship: one list can have many tasks
    tasks = db.relationship('Task', backref='todo_list', lazy=True)

class Task(db.Model):
    """
    Represents an individual task, possibly nested (subtasks).
    Status can be: 'Todo', 'In Progress', or 'Done'.
    """
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='Todo')  # 3 possible values
    # Link to a TodoList
    list_id = db.Column(db.Integer, db.ForeignKey('todo_lists.id'), nullable=False)
    # Self-referential relationship for subtasks
    parent_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    subtasks = db.relationship(
        'Task',
        backref='parent',
        remote_side=[id],
        lazy=True
    )
