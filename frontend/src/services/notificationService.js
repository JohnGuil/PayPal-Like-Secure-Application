import api from './api';

const notificationService = {
  /**
   * Get user notifications with pagination and filters
   * @param {Object} params - Query parameters (unread, type, page, per_page)
   * @returns {Promise}
   */
  getNotifications: (params = {}) => {
    return api.get('/notifications', { params });
  },

  /**
   * Get unread notification count
   * @returns {Promise}
   */
  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },

  /**
   * Mark a specific notification as read
   * @param {number} id - Notification ID
   * @returns {Promise}
   */
  markAsRead: (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   * @returns {Promise}
   */
  markAllAsRead: () => {
    return api.patch('/notifications/mark-all-read');
  },

  /**
   * Delete a specific notification
   * @param {number} id - Notification ID
   * @returns {Promise}
   */
  deleteNotification: (id) => {
    return api.delete(`/notifications/${id}`);
  },

  /**
   * Clear all read notifications
   * @returns {Promise}
   */
  clearRead: () => {
    return api.delete('/notifications/clear-read');
  },
};

export default notificationService;
