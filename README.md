# HierarchicalTodoList

The web application allows users to create and manage hierarchical todo lists with up to three levels of nesting. Built with Flask backend, SQLAlchemy for the database and React frontend.

[Here is the video demo](https://www.loom.com/share/6f742e32d8984fa698a70fac467c6a99?sid=e1454929-f53b-4d1f-8751-bd4bb887a8f1)


## Features

- **User Authentication**: Register, login, and logout functionality
- **Multiple Todo Lists**: Create and manage multiple separate todo lists
- **Hierarchical Tasks**: Create tasks with up to 3 levels of nesting (tasks, subtasks, sub-subtasks)
- **Task Management**:
  - Create, edit, and delete tasks at any level
  - Mark tasks as complete (Done) /incomplete (Todo)
  - Automatic parent task completion when all subtasks are done (not fully functional)
  - Automatic parent task reopening when a subtask is reopened
  - Add subtasks to existing tasks
- **Task Organization**:
  - Move tasks between lists
  - Move tasks within the hierarchy (not fully functional)
  - Collapse/expand subtasks for better focus
- **Progress Tracking**: Real-time progress bar showing completion status
- **Multi-user Support**: Each user can only see and manage their own lists and tasks

## Tech Stack

### Backend
- Python 3.8+
- Flask
- SQLAlchemy
- Flask-Login for authentication
- Flask-CORS for cross-origin requests

### Frontend
- React
- React Router for navigation
- Axios for API requests
- React-Toastify for notifications
- Lucide React for icons



## Project Structure

```plaintext
hierarchical-todo-app/
├── server/                 # Flask backend
│   ├── app.py              # Flask application entry point
│   ├── config.py           # Configuration settings
│   ├── models.py           # Database models
│   ├── manage.py           # Migration management
│   ├── requirements.txt    # Python dependencies
│   └── routes/             # API routes
│       ├── auth.py         # Authentication routes
│       └── todos.py        # Todo list and task routes
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # React components
│       ├── context/        # React context (auth)
│       ├── pages/          # Page components
│       ├── services/       # API services
│       └── App.js          # Main App component
└── README.md               # Project documentation
```

## Setup and Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn


### Backend Setup

1. Navigate to the server directory:

```shellscript
cd HierarchicalTodoList/server
```


2. Create and activate a virtual environment:

```shellscript
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```


3. Install the required Python packages:

```shellscript
pip install -r requirements.txt
```


4. Initialize the database with migrations:

```shellscript
# Initialize migrations (only needed once)
flask db init

# Create the initial migration
flask db migrate -m "Initial migration"

# Apply the migration
flask db upgrade
```


5. Run the Flask server:

```shellscript
# Option 1: Using flask run
export FLASK_APP=app.py  # On Windows: set FLASK_APP=app.py
export FLASK_ENV=development  # On Windows: set FLASK_ENV=development
flask run

# Option 2: Directly using Python
python app.py
```

The Flask server will run at [http://localhost:5000](http://localhost:5000)

### Frontend Setup

1. Navigate to the client directory:

```shellscript
cd HierarchicalTodoList/client
```


2. Install the required npm packages:

```shellscript
npm install
```


3. Run the React development server:

```shellscript
npm start
```

The React application will run at [http://localhost:3000](http://localhost:3000)


## API Documentation

### Authentication Endpoints

#### Register a new user

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Request Body**:

```json
{
  "username": "user",
  "password": "password"
}
```

- **Success Response**: `201 Created`

```json
{
  "message": "User registered successfully"
}
```

- **Error Response**: `400 Bad Request`

```json
{
  "error": "Username already exists"
}
```


#### Login

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Request Body**:

```json
{
  "username": "user",
  "password": "password"
}
```


- **Success Response**: `200 OK`

```json
{
  "message": "Logged in successfully",
  "user": {
    "id": 1,
    "username": "user"
  }
}
```

- **Error Response**: `401 Unauthorized`

```json
{
  "error": "Invalid credentials"
}
```


#### Logout

- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Authentication**: Required
- **Success Response**: `200 OK`

```json
{
  "message": "Logged out"
}
```


### Todo List Endpoints

#### Get all lists for the current user

- **URL**: `/api/todos/lists`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response**: `200 OK`

```json
[
  {
    "id": 1,
    "title": "Work Tasks"
  },
  {
    "id": 2,
    "title": "Personal Tasks"
  }
]
```

#### Create a new list

- **URL**: `/api/todos/list`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:

```json
{
  "title": "New List"
}
```

- **Success Response**: `201 Created`

```json
{
  "message": "Todo list created",
  "list_id": 3
}
```

- **Error Response**: `409 Conflict`

```json
{
  "error": "A list with this name already exists"
}
```

### Task Endpoints

#### Get all tasks for a list

- **URL**: `/api/todos/tasks/{list_id}`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response**: `200 OK`

```json
[
  {
    "id": 1,
    "title": "Main Task",
    "description": "This is a main task",
    "status": "Todo",
    "list_id": 1,
    "subtasks": [
      {
        "id": 2,
        "title": "Subtask",
        "description": "This is a subtask",
        "status": "Todo",
        "list_id": 1,
        "subtasks": []
      }
    ]
  }
]
```



#### Create a new task

- **URL**: `/api/todos/task`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:

```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "Todo",
  "list_id": 1,
  "parent_id": null
}
```


- **Success Response**: `201 Created`

```json
{
  "message": "Task added",
  "task_id": 3
}
```


- **Error Response**: `409 Conflict`

```json
{
  "error": "A task with this name already exists in this list"
}
```

#### Update task status

- **URL**: `/api/todos/task/{task_id}/status`
- **Method**: `PATCH`
- **Authentication**: Required
- **Request Body**:

```json
{
  "status": "Done"
}
```


- **Success Response**: `200 OK`

```json
{
  "message": "Status updated",
  "task_id": 1,
  "new_status": "Done"
}
```

#### Delete a task

- **URL**: `/api/todos/task/{task_id}`
- **Method**: `DELETE`
- **Authentication**: Required
- **Success Response**: `200 OK`

```json
{
  "message": "Task deleted successfully"
}
```


#### Move a task

- **URL**: `/api/todos/task/{task_id}/move`
- **Method**: `PATCH`
- **Authentication**: Required
- **Request Body**:

```json
{
  "list_id": 2,
  "parent_id": null
}
```


- **Success Response**: `200 OK`

```json
{
  "message": "Task moved successfully",
  "task_id": 1,
  "new_list_id": 2,
  "new_parent_id": null
}
```


- **Error Response**: `400 Bad Request`

```json
{
  "error": "Max depth (3) reached"
}
```

## Usage Guide

### Authentication

1. Register a new account or login with existing credentials
2. The application will automatically log you in after registration
3. You can log out using the logout button in the sidebar


### Managing Lists

1. Create a new todo list from the sidebar using the "+" button
2. Click on a list in the sidebar to view its tasks
3. Delete a list by clicking the "×" button next to its name


### Managing Tasks

1. Add a top-level task using the "Add Task" button
2. Add subtasks to a task using the task menu (three dots icon)
3. Mark tasks as complete by clicking the checkbox
4. Expand/collapse subtasks using the arrow icon
5. Move tasks between lists or within the hierarchy using the move icon
6. Delete tasks using the task menu


### Task Hierarchy Rules

1. Tasks can have up to 3 levels of nesting (tasks, subtasks, sub-subtasks)
2. A parent task cannot be marked as complete until all its subtasks are complete
3. When all subtasks are marked as complete, the parent task is automatically marked as complete
4. When a parent task is reopened, you have the option to reopen all its subtasks
5. Adding a new subtask to a completed parent task automatically reopens the parent


## Troubleshooting

### CORS Issues

If you encounter CORS issues:

1. Make sure the Flask server is running and accessible
2. Verify that the CORS configuration in app.py matches your frontend URL
3. Check that credentials are being sent with requests


### Authentication Issues

If you encounter authentication issues:

1. Make sure cookies are being properly set and sent with requests
2. Check that the session configuration in Flask is correct
3. Try clearing your browser cookies and logging in again


## AI Statement

Utilized ChatGPT for code generation, v0 for the UI and frontend and Github copilot for debugging.
