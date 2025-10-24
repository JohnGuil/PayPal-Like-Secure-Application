<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginLog;
use Illuminate\Http\Request;

class LoginLogController extends Controller
{
    /**
     * Display a listing of login logs
     */
    public function index(Request $request)
    {
        // Check permission - allow either view-login-logs or view-all-login-logs
        if (!$request->user()->hasPermission('view-login-logs') && 
            !$request->user()->hasPermission('view-all-login-logs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = LoginLog::with('user');

        // If user doesn't have view-all permission, only show their logs
        if (!$request->user()->hasPermission('view-all-login-logs')) {
            $query->where('user_id', $request->user()->id);
        }

        // Filter by user
        if ($request->has('user_id') && $request->user()->hasPermission('view-all-login-logs')) {
            $query->where('user_id', $request->user_id);
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('ip_address', 'LIKE', "%{$search}%")
                  ->orWhere('user_agent', 'LIKE', "%{$search}%")
                  ->orWhereHas('user', function($q) use ($search) {
                      $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('email', 'LIKE', "%{$search}%");
                  });
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
     * Display the specified login log
     */
    public function show(Request $request, $id)
    {
        // Check permission - allow either view-login-logs or view-all-login-logs
        if (!$request->user()->hasPermission('view-login-logs') && 
            !$request->user()->hasPermission('view-all-login-logs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $log = LoginLog::with('user')->findOrFail($id);

        // Check if user has access to this log
        if (!$request->user()->hasPermission('view-all-login-logs')) {
            if ($log->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json($log);
    }

    /**
     * Get login statistics
     */
    public function statistics(Request $request)
    {
        // Check permission - allow either view-login-logs or view-all-login-logs
        if (!$request->user()->hasPermission('view-login-logs') && 
            !$request->user()->hasPermission('view-all-login-logs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $baseQuery = LoginLog::query();

        // If user doesn't have view-all permission, only show their logs
        if (!$request->user()->hasPermission('view-all-login-logs')) {
            $baseQuery->where('user_id', $request->user()->id);
        }

        $stats = [
            'total' => (clone $baseQuery)->count(),
            'today' => (clone $baseQuery)->whereDate('created_at', today())->count(),
            'this_week' => (clone $baseQuery)->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'unique_users' => (clone $baseQuery)->distinct('user_id')->count('user_id'),
            'unique_ips' => (clone $baseQuery)->distinct('ip_address')->count('ip_address'),
        ];

        return response()->json($stats);
    }
}
