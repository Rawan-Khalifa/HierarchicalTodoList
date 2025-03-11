import React, { useState } from 'react';
import { loginUser, getTodoLists } from '../services/api';

const LoginComponent = ({ history }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginUser(username, password);
      // Fetch todo lists after successful login
      const todoLists = await getTodoLists();
      console.log('Todo Lists:', todoLists);
      // Redirect to the todo list page
      history.push('/todolists');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default LoginComponent;