// src/components/TodoList.js
import React, { useState, useEffect } from 'react';
import { getTasksForList, addTask } from '../services/api';
import TodoItem from './TodoItem';

const TodoList = ({ listId, title }) => {
  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');

  const fetchTasks = async () => {
    try {
      const data = await getTasksForList(listId);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [listId]);

  // Create a new top-level task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    await addTask(taskTitle, taskDesc, 'Todo', listId, null);
    setTaskTitle('');
    setTaskDesc('');
    fetchTasks();
  };

  // Separate tasks by status
  const tasksTodo = tasks.filter(t => t.status === 'Todo');
  const tasksInProgress = tasks.filter(t => t.status === 'In Progress');
  const tasksDone = tasks.filter(t => t.status === 'Done');

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>{title}</h3>
      {/* Form to create a new top-level task */}
      <form onSubmit={handleCreateTask}>
        <input
          type="text"
          placeholder="Task Title"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Task Description"
          value={taskDesc}
          onChange={(e) => setTaskDesc(e.target.value)}
        />
        <button type="submit">Create Task</button>
      </form>

      {/* Render 3 columns */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        {/* Todo Column */}
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
          <h4>Todo</h4>
          {tasksTodo.map(task => (
            <TodoItem
              key={task.id}
              task={task}
              listId={listId}
              refreshTasks={fetchTasks}
            />
          ))}
        </div>

        {/* In Progress Column */}
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
          <h4>In Progress</h4>
          {tasksInProgress.map(task => (
            <TodoItem
              key={task.id}
              task={task}
              listId={listId}
              refreshTasks={fetchTasks}
            />
          ))}
        </div>

        {/* Done Column */}
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
          <h4>Done</h4>
          {tasksDone.map(task => (
            <TodoItem
              key={task.id}
              task={task}
              listId={listId}
              refreshTasks={fetchTasks}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodoList;
