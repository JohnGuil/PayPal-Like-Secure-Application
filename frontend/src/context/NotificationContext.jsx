import { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /**
   * Fetch notifications with optional filters
   */
  const fetchNotifications = async (params = {}) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(params);
      setNotifications(response.data.notifications);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch unread notification count
   */
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.unread_count);
      return response.data.unread_count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      return 0;
    }
  };

  /**
   * Mark a notification as read
   */
  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
      
      // Decrease unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      return response.data;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return null;
    }
  };

  /**
   * Delete a notification
   */
  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      
      // Check if notification was unread before removing
      const deletedNotif = notifications.find(n => n.id === id);
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Remove from local state
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  };

  /**
   * Clear all read notifications
   */
  const clearRead = async () => {
    try {
      const response = await notificationService.clearRead();
      
      // Remove read notifications from local state
      setNotifications(prev => prev.filter(notif => !notif.is_read));
      
      return response.data;
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
      return null;
    }
  };

  /**
   * Refresh notifications and unread count
   */
  const refresh = async () => {
    await Promise.all([
      fetchNotifications({ per_page: 10 }),
      fetchUnreadCount()
    ]);
  };

  // Auto-refresh unread count every 30 seconds
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearRead,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;
