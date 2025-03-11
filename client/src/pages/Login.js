import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import './Login.css'; // Import the CSS file

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(username, password);
      console.log("data:", data);
      if (data.message === "Logged in successfully") {
        setMessage(data.message);
        navigate('/dashboard');
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Login failed';
      setMessage(errMsg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Log in</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="johndoe@gmail.com"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Log in</button>
        </form>
        {message && <p className="message">{message}</p>}
        <p className="signup-text">
          or, <a href="/register">sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
