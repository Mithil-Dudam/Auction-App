import { Navigate } from 'react-router-dom';
import { useAppContext } from './AppContext';
import React from 'react';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { isLoggedIn } = useAppContext();

  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;