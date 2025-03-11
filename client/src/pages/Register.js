import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import './Register.css'; // Import the CSS file

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await registerUser(username, password);
      setMessage(data.message || 'Registration successful');
      navigate('/login');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Registration failed';
      setMessage(errMsg);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Sign up</h2>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Email"
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
          <button type="submit">Sign up</button>
        </form>
        {message && <p className="message">{message}</p>}
        <p className="login-text">
          or, <a href="/login">log in</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
