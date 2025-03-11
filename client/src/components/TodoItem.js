// src/components/TodoItem.js
import React, { useState } from 'react';
import { addTask, updateTaskStatus } from '../services/api';

const TodoItem = ({ task, listId, refreshTasks }) => {
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDesc, setSubtaskDesc] = useState('');

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    await addTask(subtaskTitle, subtaskDesc, 'Todo', listId, task.id);
    setSubtaskTitle('');
    setSubtaskDesc('');
    setShowSubtaskForm(false);
    refreshTasks();
  };

  const handleChangeStatus = async (newStatus) => {
    await updateTaskStatus(task.id, newStatus);
    refreshTasks();
  };

  return (
    <div style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
      <h4>{task.title} ({task.status})</h4>
      <p>{task.description}</p>
      <div>
        {/* Status change buttons */}
        {task.status !== 'Todo' && (
          <button onClick={() => handleChangeStatus('Todo')}>Move to Todo</button>
        )}
        {task.status !== 'In Progress' && (
          <button onClick={() => handleChangeStatus('In Progress')}>Move to In Progress</button>
        )}
        {task.status !== 'Done' && (
          <button onClick={() => handleChangeStatus('Done')}>Move to Done</button>
        )}

        {/* Toggle subtask form */}
        <button onClick={() => setShowSubtaskForm(!showSubtaskForm)}>
          Add Subtask
        </button>
      </div>

      {showSubtaskForm && (
        <form onSubmit={handleAddSubtask} style={{ marginTop: '10px' }}>
          <input
            type="text"
            placeholder="Subtask Title"
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Subtask Description"
            value={subtaskDesc}
            onChange={(e) => setSubtaskDesc(e.target.value)}
          />
          <button type="submit">Create Subtask</button>
        </form>
      )}

      {/* Recursively render subtasks */}
      {task.subtasks && task.subtasks.map((sub) => (
        <TodoItem
          key={sub.id}
          task={sub}
          listId={listId}
          refreshTasks={refreshTasks}
        />
      ))}
    </div>
  );
};

export default TodoItem;
