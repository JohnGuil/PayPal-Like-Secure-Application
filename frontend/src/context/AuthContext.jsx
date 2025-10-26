import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      // Refresh user data from server to get latest permissions
      refreshUser().catch(console.error);
    }
    setLoading(false);
  }, []);

  // Refresh user data every 5 minutes to get latest permissions
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      refreshUser().catch(console.error);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (!data.requires_2fa && data.user) {
      setUser(data.user);
    }
    return data;
  };

  const verify2FALogin = async (userId, code) => {
    const data = await authService.verify2FALogin(userId, code);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      const data = await authService.getCurrentUser();
      if (data.user) {
        setUser(data.user);
        // Also update localStorage to keep it in sync
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    verify2FALogin,
    register,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: authService.isAuthenticated(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
