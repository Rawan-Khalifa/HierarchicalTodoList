# HierarchicalTodoList



## Server

server/
  ├── app.py             # Main entry point for your Flask app
  ├── config.py          # Configuration file (database URI, secret key, etc.)
  ├── models.py          # SQLAlchemy models (User, TodoList, Task)
  ├── routes/            # Folder for route definitions
  │   ├── auth.py       # Authentication routes (login, registration)
  │   └── todos.py      # Routes for CRUD operations on lists and tasks
  ├── requirements.txt   # Python dependencies
  └── migrations/        # (Optional) for database migrations if using Flask-Migrate
