import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return children ? children : <Outlet />;
};

export default PrivateRoute;
