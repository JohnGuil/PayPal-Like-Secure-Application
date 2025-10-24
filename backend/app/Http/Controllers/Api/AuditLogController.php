<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RolePermissionAudit;
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

        $query = RolePermissionAudit::with('user');

        // Filter by action
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        // Filter by entity type (role or permission)
        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }

        // Filter by entity ID
        if ($request->has('entity_id')) {
            $query->where('entity_id', $request->entity_id);
        }

        // Filter by user (admin who performed the action)
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Date range filter
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('user', function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                })
                ->orWhere('action', 'LIKE', "%{$search}%")
                ->orWhere('entity_type', 'LIKE', "%{$search}%")
                ->orWhere('ip_address', 'LIKE', "%{$search}%");
            });
        }

        // Order by latest first
        $query->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->input('per_page', 15);
        $logs = $query->paginate($perPage);

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

        $log = RolePermissionAudit::with('user')->findOrFail($id);

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

        $stats = [
            'total' => RolePermissionAudit::count(),
            'assigned' => RolePermissionAudit::where('action', 'assigned')->count(),
            'revoked' => RolePermissionAudit::where('action', 'revoked')->count(),
            'today' => RolePermissionAudit::whereDate('created_at', today())->count(),
            'this_week' => RolePermissionAudit::whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ])->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Export audit logs to CSV
     */
    public function export(Request $request)
    {
        // Check permission (Super Admin only)
        if (!$request->user()->hasPermission('view-audit-logs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $logs = RolePermissionAudit::with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        $csvData = "Timestamp,User,Action,Entity Type,Entity ID,IP Address,Old Value,New Value\n";

        foreach ($logs as $log) {
            $csvData .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                $log->created_at->format('Y-m-d H:i:s'),
                $log->user ? $log->user->name : 'N/A',
                $log->action,
                $log->entity_type,
                $log->entity_id ?? 'N/A',
                $log->ip_address ?? 'N/A',
                json_encode($log->old_value),
                json_encode($log->new_value)
            );
        }

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="audit-logs-' . date('Y-m-d') . '.csv"');
    }
}
