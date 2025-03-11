// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodoLists, logoutUser } from '../services/api';
import TodoList from '../components/TodoList';

const Dashboard = () => {
  const [lists, setLists] = useState([]);
  const navigate = useNavigate();

  const fetchLists = async () => {
    try {
      const data = await getTodoLists();
      setLists(data);
    } catch (error) {
      console.error('Error fetching lists:', error);
      // If you want to handle 401s manually here, you could do:
      // if (error.response && error.response.status === 401) {
      //   navigate('/login');
      // }
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser();
      // Once logged out, navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div style={{ margin: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {lists.map((lst) => (
        <TodoList
          key={lst.id}
          listId={lst.id}
          title={lst.title}
        />
      ))}
    </div>
  );
};

export default Dashboard;
