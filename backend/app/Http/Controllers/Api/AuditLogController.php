<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs
     */
    public function index(Request $request)
    {
        // Check permission (Super Admin only)
        if (!$request->user()->hasPermission('view-audit-logs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = AuditLog::with('user');

        // Filter by action
        if ($request->has('action')) {
            $query->byAction($request->action);
        }

        // Filter by resource type
        if ($request->has('resource_type')) {
            $query->byResourceType($request->resource_type);
        }

        // Filter by resource ID
        if ($request->has('resource_id')) {
            $query->where('resource_id', $request->resource_id);
        }

        // Filter by user (who performed the action)
        if ($request->has('user_id')) {
            $query->byUser($request->user_id);
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        } elseif ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        } elseif ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'LIKE', "%{$search}%")
                  ->orWhere('action', 'LIKE', "%{$search}%")
                  ->orWhere('resource_type', 'LIKE', "%{$search}%")
                  ->orWhere('ip_address', 'LIKE', "%{$search}%")
                  ->orWhereHas('user', function($q) use ($search) {
                      $q->where('full_name', 'LIKE', "%{$search}%")
                        ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Order by latest first
        $query->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->input('per_page', 15);
        $logs = $query->paginate($perPage);

        // Transform the data to extract role, permission, and user data from JSON fields
        $logs->getCollection()->transform(function ($log) {
            // Rename 'user' to 'admin_user' (the person who performed the action)
            $log->admin_user = $log->user;
            unset($log->user);

            // Extract role from new_values or old_values (for role-related actions)
            if (in_array($log->action, ['role_assigned', 'role_revoked'])) {
                $roleData = $log->new_values['role'] ?? $log->old_values['role'] ?? null;
                if ($roleData) {
                    $log->role = (object)[
                        'id' => $roleData['id'] ?? null,
                        'name' => $roleData['name'] ?? null,
                        'slug' => $roleData['slug'] ?? null,
                    ];
                }
            }

            // Extract permissions from new_values or old_values (for permission-related actions)
            if (in_array($log->action, ['permissions_assigned', 'permissions_revoked'])) {
                $permissionsData = $log->new_values['permissions'] ?? $log->old_values['permissions'] ?? [];
                if (!empty($permissionsData)) {
                    $firstPermission = is_array($permissionsData) ? $permissionsData[0] : $permissionsData;
                    $log->permission = (object)[
                        'id' => $firstPermission['id'] ?? null,
                        'name' => $firstPermission['name'] ?? null,
                        'slug' => $firstPermission['slug'] ?? null,
                    ];
                }
            }

            // For user-related actions, the resource_id points to the target user
            if ($log->resource_type === 'User' && $log->resource_id) {
                $targetUser = \App\Models\User::find($log->resource_id);
                if ($targetUser) {
                    $log->target_user = (object)[
                        'id' => $targetUser->id,
                        'name' => $targetUser->full_name,
                        'email' => $targetUser->email,
                    ];
                }
            }

            return $log;
        });

        return response()->json($logs);
    }

    /**
     * Display the specified audit log
     */
    public function show(Request $request, $id)
    {
        // Check permission (Super Admin only)
        if (!$request->user()->hasPermission('view-audit-logs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $log = AuditLog::with('user')->findOrFail($id);

        return response()->json($log);
    }

    /**
     * Get audit statistics
     */
    public function statistics(Request $request)
    {
        // Check permission (Super Admin only)
        if (!$request->user()->hasPermission('view-audit-logs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = AuditLog::query();

        // Apply same filters as index if provided
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->dateRange($request->start_date, $request->end_date);
        }

        $stats = [
            'total' => $query->count(),
            'by_action' => $query->groupBy('action')
                ->selectRaw('action, count(*) as count')
                ->pluck('count', 'action'),
            'by_resource_type' => $query->groupBy('resource_type')
                ->selectRaw('resource_type, count(*) as count')
                ->pluck('count', 'resource_type'),
            'recent_activities' => AuditLog::with('user')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
            'top_users' => $query->whereNotNull('user_id')
                ->groupBy('user_id')
                ->selectRaw('user_id, count(*) as activity_count')
                ->orderByDesc('activity_count')
                ->limit(10)
                ->with('user')
                ->get()
                ->map(function($item) {
                    return [
                        'user' => $item->user,
                        'activity_count' => $item->activity_count
                    ];
                })
        ];

        return response()->json($stats);
    }
}
