import api from './api';

const analyticsService = {
  /**
   * Get dashboard overview with today's KPIs
   */
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  /**
   * Get transaction analytics
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date (YYYY-MM-DD)
   * @param {string} params.end_date - End date (YYYY-MM-DD)
   * @param {string} params.period - Grouping period (day/week/month/year)
   */
  getTransactionAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/transactions', { params });
    return response.data;
  },

  /**
   * Get user analytics
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date (YYYY-MM-DD)
   * @param {string} params.end_date - End date (YYYY-MM-DD)
   */
  getUserAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/users', { params });
    return response.data;
  },

  /**
   * Get financial analytics
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date (YYYY-MM-DD)
   * @param {string} params.end_date - End date (YYYY-MM-DD)
   */
  getFinancialAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/financial', { params });
    return response.data;
  },
};

export default analyticsService;
