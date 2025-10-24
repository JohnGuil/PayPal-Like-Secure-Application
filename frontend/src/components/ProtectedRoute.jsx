import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check permission if required
  if (requiredPermission && user) {
    const hasPermission = user.permissions?.some(
      p => p.slug === requiredPermission
    );
    
    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="card max-w-md text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Required permission: <code className="bg-gray-100 px-2 py-1 rounded">{requiredPermission}</code>
            </p>
            <Navigate to="/dashboard" replace />
          </div>
        </div>
      );
    }
  }

  // Check role if required
  if (requiredRole && user) {
    const hasRole = user.roles?.some(
      r => r.slug === requiredRole
    );
    
    if (!hasRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="card max-w-md text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have the required role to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Required role: <code className="bg-gray-100 px-2 py-1 rounded">{requiredRole}</code>
            </p>
            <Navigate to="/dashboard" replace />
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
