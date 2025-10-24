import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TwoFactorVerify from './pages/TwoFactorVerify';
import TwoFactorSetup from './pages/TwoFactorSetup';
import TwoFactorDisable from './pages/TwoFactorDisable';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Transactions from './pages/Transactions';
import LoginLogs from './pages/LoginLogs';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import SystemSettings from './pages/SystemSettings';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-2fa" element={<TwoFactorVerify />} />
          
          {/* Protected Routes with Layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/users" element={
              <ProtectedRoute requiredPermission="view-users">
                <Users />
              </ProtectedRoute>
            } />

            <Route path="/roles" element={
              <ProtectedRoute requiredPermission="view-roles">
                <Roles />
              </ProtectedRoute>
            } />

            <Route path="/transactions" element={
              <ProtectedRoute requiredPermission={["view-transactions", "view-all-transactions"]}>
                <Transactions />
              </ProtectedRoute>
            } />

            <Route path="/login-logs" element={
              <ProtectedRoute requiredPermission={["view-login-logs", "view-all-login-logs"]}>
                <LoginLogs />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute requiredPermission="manage-own-account">
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute requiredPermission="view-admin-dashboard">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute requiredPermission="view-system-settings">
                <SystemSettings />
              </ProtectedRoute>
            } />

            <Route path="/audit-logs" element={
              <ProtectedRoute requiredPermission="view-audit-logs">
                <AuditLogs />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute requiredPermission="generate-reports">
                <Reports />
              </ProtectedRoute>
            } />
            
            <Route path="/setup-2fa" element={<TwoFactorSetup />} />
            <Route path="/disable-2fa" element={<TwoFactorDisable />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
