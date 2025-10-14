import api from './api';

class AuthService {
  async register(userData) {
    const response = await api.post('/register', userData);
    return response.data;
  }

  async login(credentials) {
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
