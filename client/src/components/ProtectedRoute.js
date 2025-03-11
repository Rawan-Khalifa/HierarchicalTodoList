import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element: Element, ...rest }) => {
  const isAuthenticated = !!localStorage.getItem('user'); // Check if user is authenticated

  return isAuthenticated ? <Element {...rest} /> : <Navigate to="/login" />; // Redirect to login if not authenticated
};

export default ProtectedRoute;