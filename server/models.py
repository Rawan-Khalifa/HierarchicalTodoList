from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# User model: Each user has unique tasks and lists
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    # One-to-many relationship: one user, many lists
    todo_lists = db.relationship('TodoList', backref='owner', lazy=True)

# TodoList model: Each list belongs to a user
class TodoList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # One-to-many relationship: one list, many tasks
    tasks = db.relationship('Task', backref='todo_list', lazy=True)

# Task model: A task can have multiple subtasks, allowing a hierarchical structure
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    # Parent task for hierarchy (nullable for top-level tasks)
    parent_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True)
    # Self-referential relationship to manage sub-tasks
    subtasks = db.relationship('Task', backref=db.backref('parent', remote_side=[id]), lazy=True)
    # Associate task with a list
    list_id = db.Column(db.Integer, db.ForeignKey('todo_list.id'), nullable=False)
