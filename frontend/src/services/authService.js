import api from './api';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class AuthService {
  // Get CSRF cookie before making authenticated requests
  async getCsrfCookie() {
    try {
      await axios.get(`${API_URL}/sanctum/csrf-cookie`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error('Failed to get CSRF cookie:', error);
    }
  }

  async register(userData) {
    await this.getCsrfCookie();
    const response = await api.post('/register', userData);
    return response.data;
  }

  async login(credentials) {
    await this.getCsrfCookie();
    const response = await api.post('/login', credentials);
    
    if (response.data.requires_2fa) {
      return response.data;
    }
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  async verify2FALogin(userId, code) {
    await this.getCsrfCookie();
    const response = await api.post('/2fa/verify-login', {
      user_id: userId,
      code: code,
    });
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  }

  async logout() {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser() {
    const response = await api.get('/user');
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async setup2FA() {
    const response = await api.post('/2fa/setup');
    return response.data;
  }

  async verify2FA(code) {
    const response = await api.post('/2fa/verify', { code });
    return response.data;
  }

  async disable2FA(password) {
    const response = await api.post('/2fa/disable', { password });
    return response.data;
  }

  getStoredUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }
}

export default new AuthService();
