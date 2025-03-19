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
