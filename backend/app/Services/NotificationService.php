<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Create a new notification for a user.
     *
     * @param int $userId
     * @param string $type (transaction|security|account|system)
     * @param string $title
     * @param string $message
     * @param array $data Additional metadata
     * @param string|null $actionUrl Link to related resource
     * @param string $icon Icon name
     * @param string $priority (low|medium|high|critical)
     * @return Notification|null
     */
    public function create(
        int $userId,
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?string $actionUrl = null,
        string $icon = 'bell',
        string $priority = 'medium'
    ): ?Notification {
        try {
            return Notification::create([
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
                'action_url' => $actionUrl,
                'icon' => $icon,
                'priority' => $priority,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get user notifications with pagination.
     *
     * @param int $userId
     * @param bool $unreadOnly
     * @param string|null $type Filter by type
     * @param int $perPage
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getUserNotifications(
        int $userId,
        bool $unreadOnly = false,
        ?string $type = null,
        int $perPage = 20
    ) {
        $query = Notification::where('user_id', $userId);

        if ($unreadOnly) {
            $query->unread();
        }

        if ($type) {
            $query->ofType($type);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Mark a notification as read.
     *
     * @param int $notificationId
     * @param int $userId
     * @return bool
     */
    public function markAsRead(int $notificationId, int $userId): bool
    {
        try {
            $notification = Notification::where('id', $notificationId)
                ->where('user_id', $userId)
                ->first();

            if ($notification) {
                $notification->markAsRead();
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Failed to mark notification as read', [
                'notification_id' => $notificationId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Mark all notifications as read for a user.
     *
     * @param int $userId
     * @return int Number of notifications marked as read
     */
    public function markAllAsRead(int $userId): int
    {
        try {
            return Notification::where('user_id', $userId)
                ->unread()
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark all notifications as read', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Delete a notification.
     *
     * @param int $notificationId
     * @param int $userId
     * @return bool
     */
    public function delete(int $notificationId, int $userId): bool
    {
        try {
            $notification = Notification::where('id', $notificationId)
                ->where('user_id', $userId)
                ->first();

            if ($notification) {
                $notification->delete();
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Failed to delete notification', [
                'notification_id' => $notificationId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Delete all read notifications for a user.
     *
     * @param int $userId
     * @return int Number of notifications deleted
     */
    public function deleteAllRead(int $userId): int
    {
        try {
            return Notification::where('user_id', $userId)
                ->read()
                ->delete();
        } catch (\Exception $e) {
            Log::error('Failed to delete read notifications', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Get unread notification count for a user.
     *
     * @param int $userId
     * @return int
     */
    public function getUnreadCount(int $userId): int
    {
        try {
            return Notification::where('user_id', $userId)
                ->unread()
                ->count();
        } catch (\Exception $e) {
            Log::error('Failed to get unread count', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Delete old notifications (cleanup job).
     *
     * @param int $days Delete notifications older than X days
     * @return int Number of notifications deleted
     */
    public function deleteOldNotifications(int $days = 30): int
    {
        try {
            return Notification::where('created_at', '<', now()->subDays($days))
                ->delete();
        } catch (\Exception $e) {
            Log::error('Failed to delete old notifications', [
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Send notification to multiple users.
     *
     * @param array $userIds
     * @param string $type
     * @param string $title
     * @param string $message
     * @param array $data
     * @param string|null $actionUrl
     * @param string $icon
     * @param string $priority
     * @return int Number of notifications created
     */
    public function createForMultipleUsers(
        array $userIds,
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?string $actionUrl = null,
        string $icon = 'bell',
        string $priority = 'medium'
    ): int {
        $count = 0;

        foreach ($userIds as $userId) {
            if ($this->create($userId, $type, $title, $message, $data, $actionUrl, $icon, $priority)) {
                $count++;
            }
        }

        return $count;
    }
}
