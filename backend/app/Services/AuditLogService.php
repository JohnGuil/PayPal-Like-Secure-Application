<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class AuditLogService
{
    /**
     * Log an action.
     *
     * @param string $action The action performed (created, updated, deleted, etc.)
     * @param string $resourceType The type of resource (User, Role, Transaction, etc.)
     * @param int|null $resourceId The ID of the resource
     * @param string|null $description Human-readable description
     * @param array|null $oldValues Previous state (for updates)
     * @param array|null $newValues New state (for updates/creates)
     * @param Request|null $request Request object for IP and user agent
     * @param mixed $explicitUser Explicit user to use instead of Auth::user() (useful for login events)
     * @return AuditLog
     */
    public static function log(
        string $action,
        string $resourceType,
        ?int $resourceId = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null,
        mixed $explicitUser = null
    ): AuditLog {
        $user = $explicitUser ?? Auth::user();
        $request = $request ?? request();

        return AuditLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'description' => $description,
            'old_values' => $oldValues ? self::filterSensitiveData($oldValues) : null,
            'new_values' => $newValues ? self::filterSensitiveData($newValues) : null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * Log user creation.
     */
    public static function logUserCreated($user, Request $request = null): AuditLog
    {
        return self::log(
            action: 'created',
            resourceType: 'User',
            resourceId: $user->id,
            description: "User '{$user->full_name}' ({$user->email}) was created",
            newValues: $user->toArray(),
            request: $request
        );
    }

    /**
     * Log user update.
     */
    public static function logUserUpdated($user, array $oldValues, Request $request = null): AuditLog
    {
        return self::log(
            action: 'updated',
            resourceType: 'User',
            resourceId: $user->id,
            description: "User '{$user->full_name}' ({$user->email}) was updated",
            oldValues: $oldValues,
            newValues: $user->toArray(),
            request: $request
        );
    }

    /**
     * Log user deletion.
     */
    public static function logUserDeleted($user, Request $request = null): AuditLog
    {
        return self::log(
            action: 'deleted',
            resourceType: 'User',
            resourceId: $user->id,
            description: "User '{$user->full_name}' ({$user->email}) was deleted",
            oldValues: $user->toArray(),
            request: $request
        );
    }

    /**
     * Log role assignment.
     */
    public static function logRoleAssigned($user, $role, Request $request = null): AuditLog
    {
        return self::log(
            action: 'role_assigned',
            resourceType: 'User',
            resourceId: $user->id,
            description: "Role '{$role->name}' was assigned to user '{$user->full_name}'",
            newValues: ['role' => $role->toArray()],
            request: $request
        );
    }

    /**
     * Log role revocation.
     */
    public static function logRoleRevoked($user, $role, Request $request = null): AuditLog
    {
        return self::log(
            action: 'role_revoked',
            resourceType: 'User',
            resourceId: $user->id,
            description: "Role '{$role->name}' was revoked from user '{$user->full_name}'",
            oldValues: ['role' => $role->toArray()],
            request: $request
        );
    }

    /**
     * Log permission assignment.
     */
    public static function logPermissionsAssigned($role, array $permissions, Request $request = null): AuditLog
    {
        $permissionNames = collect($permissions)->pluck('name')->implode(', ');
        
        return self::log(
            action: 'permissions_assigned',
            resourceType: 'Role',
            resourceId: $role->id,
            description: "Permissions assigned to role '{$role->name}': {$permissionNames}",
            newValues: ['permissions' => $permissions],
            request: $request
        );
    }

    /**
     * Log permission revocation.
     */
    public static function logPermissionsRevoked($role, array $permissions, Request $request = null): AuditLog
    {
        $permissionNames = collect($permissions)->pluck('name')->implode(', ');
        
        return self::log(
            action: 'permissions_revoked',
            resourceType: 'Role',
            resourceId: $role->id,
            description: "Permissions revoked from role '{$role->name}': {$permissionNames}",
            oldValues: ['permissions' => $permissions],
            request: $request
        );
    }

    /**
     * Log transaction creation.
     */
    public static function logTransactionCreated($transaction, Request $request = null): AuditLog
    {
        return self::log(
            action: 'created',
            resourceType: 'Transaction',
            resourceId: $transaction->id,
            description: "Transaction of {$transaction->amount} {$transaction->currency} created from user {$transaction->sender_id} to {$transaction->recipient_id}",
            newValues: $transaction->toArray(),
            request: $request
        );
    }

    /**
     * Log transaction refund.
     */
    public static function logTransactionRefunded($originalTransaction, $refundTransaction, Request $request = null): AuditLog
    {
        return self::log(
            action: 'refunded',
            resourceType: 'Transaction',
            resourceId: $originalTransaction->id,
            description: "Transaction #{$originalTransaction->id} refunded with transaction #{$refundTransaction->id}",
            oldValues: $originalTransaction->toArray(),
            newValues: $refundTransaction->toArray(),
            request: $request
        );
    }

    /**
     * Log login attempt.
     */
    public static function logLogin($user, bool $success, ?string $failReason = null, Request $request = null): AuditLog
    {
        $action = $success ? 'login_success' : 'login_failed';
        $description = $success 
            ? "User '{$user->email}' logged in successfully"
            : "Failed login attempt for '{$user->email}': {$failReason}";

        return self::log(
            action: $action,
            resourceType: 'Auth',
            resourceId: $user->id,
            description: $description,
            request: $request
        );
    }

    /**
     * Log logout.
     */
    public static function logLogout($user, Request $request = null): AuditLog
    {
        return self::log(
            action: 'logout',
            resourceType: 'Auth',
            resourceId: $user->id,
            description: "User '{$user->email}' logged out",
            request: $request
        );
    }

    /**
     * Filter sensitive data from arrays before logging.
     *
     * @param array $data
     * @return array
     */
    protected static function filterSensitiveData(array $data): array
    {
        $sensitiveFields = [
            'password',
            'password_confirmation',
            'remember_token',
            'two_factor_secret',
            'two_factor_recovery_codes'
        ];

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '[REDACTED]';
            }
        }

        return $data;
    }
}
