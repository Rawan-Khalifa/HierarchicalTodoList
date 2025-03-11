from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

class TodoList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('lists', lazy=True))

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(150), nullable=False)
    status = db.Column(db.String(20), default='Todo')
    list_id = db.Column(db.Integer, db.ForeignKey('todo_list.id'), nullable=False)
    list = db.relationship('TodoList', backref=db.backref('tasks', lazy=True))
    parent_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=True)
    subtasks = db.relationship('Task', backref=db.backref('parent', remote_side=[id]), lazy=True)

def get_task_depth(task):
    depth = 0
    while task.parent:
        task = task.parent
        depth += 1
    return depth

