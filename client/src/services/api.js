// src/services/api.js
import axios from 'axios';

// Ensure axios always sends cookies with requests
axios.defaults.withCredentials = true;

// Use .env or default localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Set up an interceptor to handle 401 responses
axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        // Automatically redirect to login page
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
  

/**
 * Create a new TodoList for the current user
 * POST /api/todos/list
 * Body: { title }
 */
export const createTodoList = async (title) => {
  const response = await axios.post(`${API_URL}/api/todos/list`, { title }, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Get all TodoLists for the current user
 * GET /api/todos/lists
 */
export const getTodoLists = async () => {
  const response = await axios.get(`${API_URL}/api/todos/lists`, {
    withCredentials: true
  });
  return response.data; // array of {id, title}
};

/**
 * Create a new Task or subtask
 * POST /api/todos/task
 * Body: { title, description, status, list_id, parent_id }
 */
export const addTask = async (title, description, status, listId, parentId) => {
  const response = await axios.post(`${API_URL}/api/todos/task`, {
    title,
    description,
    status,
    list_id: listId,
    parent_id: parentId,
  }, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Get tasks (with subtasks) for a given list
 * GET /api/todos/tasks/<list_id>
 */
export const getTasksForList = async (listId) => {
  const response = await axios.get(`${API_URL}/api/todos/tasks/${listId}`, {
    withCredentials: true
  });
  return response.data; // top-level tasks + nested subtasks
};

/**
 * Update task status
 * PATCH /api/todos/task/<task_id>/status
 * Body: { status: "Todo|In Progress|Done" }
 */
export const updateTaskStatus = async (taskId, newStatus) => {
  const response = await axios.patch(`${API_URL}/api/todos/task/${taskId}/status`, {
    status: newStatus,
  }, {
    withCredentials: true
  });
  return response.data;
};

/**
 * Log in a user.
 * POST /api/auth/login
 * Body: { username, password }
 */
export const loginUser = async (username, password) => {
  const response = await axios.post(`${API_URL}/api/auth/login`, {
    username,
    password,
  }, {
    withCredentials: true
  });
  // Store user data or token in local storage or state management
  localStorage.setItem('user', JSON.stringify(response.data));
  return response.data;
};

/**
 * Register a new user.
 * POST /api/auth/register
 * Body: { username, password }
 */
export const registerUser = async (username, password) => {
  const response = await axios.post(`${API_URL}/api/auth/register`, {
    username,
    password,
  }, {
    withCredentials: true
  });
  return response.data;
};


// --- Add a logout function here ---
export const logoutUser = async () => {
    const response = await axios.post(`${API_URL}/api/auth/logout`, {}, {
      withCredentials: true
    });
    return response.data;
  };