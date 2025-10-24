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
            
            <Route path="/setup-2fa" element={<TwoFactorSetup />} />
            <Route path="/disable-2fa" element={<TwoFactorDisable />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
