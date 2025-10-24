import { useAuth } from '../context/AuthContext';

/**
 * PermissionGate Component
 * 
 * Conditionally renders children based on user's permissions.
 * Useful for showing/hiding UI elements based on permissions.
 * 
 * @param {string} permission - Required permission slug (e.g., 'view-users')
 * @param {string} role - Required role slug (e.g., 'admin')
 * @param {React.ReactNode} children - Content to render if permission check passes
 * @param {React.ReactNode} fallback - Optional content to render if check fails
 */
export default function PermissionGate({ permission, role, children, fallback = null }) {
  const { user } = useAuth();

  // Check if user has the required permission
  const hasPermission = () => {
    if (permission) {
      return user?.permissions?.some(p => p.slug === permission);
    }
    return true;
  };

  // Check if user has the required role
  const hasRole = () => {
    if (role) {
      return user?.roles?.some(r => r.slug === role);
    }
    return true;
  };

  // User must have both permission and role if both are specified
  if (hasPermission() && hasRole()) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
