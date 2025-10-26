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

  /**
   * Get security analytics
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date (YYYY-MM-DD)
   * @param {string} params.end_date - End date (YYYY-MM-DD)
   */
  getSecurityAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/security', { params });
    return response.data;
  },

  /**
   * Get revenue vs volume chart data
   * @param {number} days - Number of days to fetch (default: 7)
   */
  getRevenueVolumeChart: async (days = 7) => {
    const response = await api.get('/analytics/charts/revenue-volume', { params: { days } });
    return response.data;
  },

  /**
   * Get transaction type breakdown for pie chart
   * @param {number} days - Number of days to fetch (default: 30)
   */
  getTransactionTypeBreakdown: async (days = 30) => {
    const response = await api.get('/analytics/charts/transaction-types', { params: { days } });
    return response.data;
  },

  /**
   * Get user growth chart data
   * @param {number} days - Number of days to fetch (default: 30)
   */
  getUserGrowthChart: async (days = 30) => {
    const response = await api.get('/analytics/charts/user-growth', { params: { days } });
    return response.data;
  },

  /**
   * Get hourly activity data
   * @param {number} days - Number of days to fetch (default: 7)
   */
  getHourlyActivity: async (days = 7) => {
    const response = await api.get('/analytics/charts/hourly-activity', { params: { days } });
    return response.data;
  },

  /**
   * Get KPI comparison data
   * @param {string} period - Comparison period (week/month/quarter)
   */
  getKPIComparison: async (period = 'week') => {
    const response = await api.get('/analytics/charts/kpi-comparison', { params: { period } });
    return response.data;
  },
};

export default analyticsService;
