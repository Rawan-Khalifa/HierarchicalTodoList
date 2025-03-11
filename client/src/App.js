import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterComponent from './components/RegisterComponent';
import LoginComponent from './components/LoginComponent';
import TodoListComponent from './components/TodoListComponent';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterComponent />} />
        <Route path="/login" element={<LoginComponent />} />
        <Route path="/todolists" element={<ProtectedRoute element={TodoListComponent} />} />
        <Route path="*" element={<Navigate to="/register" />} /> {/* Redirect to register by default */}
      </Routes>
    </Router>
  );
};

export default App;
