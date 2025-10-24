<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Models\LoginLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function index(Request $request)
    {
        // Check permission
        if (!$request->user()->hasPermission('view-admin-dashboard')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // User statistics
        $totalUsers = User::count();
        $activeUsers = User::whereHas('loginLogs', function($query) {
            $query->where('created_at', '>=', now()->subDays(30))
                  ->where('status', 'success');
        })->distinct()->count();
        $newUsersToday = User::whereDate('created_at', today())->count();

        // Transaction statistics
        $totalTransactions = Transaction::count();
        $completedTransactions = Transaction::where('status', 'completed')->count();
        $pendingTransactions = Transaction::where('status', 'pending')->count();
        $failedTransactions = Transaction::where('status', 'failed')->count();
        $transactionsToday = Transaction::whereDate('created_at', today())->count();

        $totalRevenue = Transaction::where('status', 'completed')
            ->where('type', '!=', 'refund')
            ->sum('amount');
        $revenueToday = Transaction::where('status', 'completed')
            ->where('type', '!=', 'refund')
            ->whereDate('created_at', today())
            ->sum('amount');

        // System health (basic metrics)
        $databaseHealth = $this->checkDatabaseHealth();
        $errorRate = $this->calculateErrorRate();

        // Recent activity
        $recentActivity = $this->getRecentActivity();

        return response()->json([
            'stats' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'total_transactions' => $totalTransactions,
                'total_revenue' => (float) $totalRevenue,
                'pending_transactions' => $pendingTransactions,
                'failed_transactions' => $failedTransactions,
                'new_users_today' => $newUsersToday,
                'transactions_today' => $transactionsToday,
                'revenue_today' => (float) $revenueToday,
                'system_health' => [
                    'database' => $databaseHealth,
                    'api_response_time' => rand(100, 200), // Mock value
                    'error_rate' => $errorRate,
                    'uptime' => 99.98 // Mock value
                ]
            ],
            'recent_activity' => $recentActivity
        ]);
    }

    /**
     * Check database health
     */
    private function checkDatabaseHealth()
    {
        try {
            DB::connection()->getPdo();
            return 'healthy';
        } catch (\Exception $e) {
            return 'unhealthy';
        }
    }

    /**
     * Calculate error rate
     */
    private function calculateErrorRate()
    {
        $totalLogins = LoginLog::whereDate('created_at', today())->count();
        $failedLogins = LoginLog::whereDate('created_at', today())
            ->where('status', 'failed')
            ->count();

        if ($totalLogins === 0) {
            return 0;
        }

        return round(($failedLogins / $totalLogins), 4);
    }

    /**
     * Get recent activity
     */
    private function getRecentActivity()
    {
        $activity = [];

        // Recent user registrations
        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'name', 'email', 'created_at']);

        foreach ($recentUsers as $user) {
            $activity[] = [
                'id' => 'user-' . $user->id,
                'type' => 'user_registered',
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email
                ],
                'timestamp' => $user->created_at->toIso8601String(),
                'icon' => 'user-plus',
                'color' => 'blue'
            ];
        }

        // Recent transactions
        $recentTransactions = Transaction::with(['sender', 'recipient'])
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        foreach ($recentTransactions as $transaction) {
            $activity[] = [
                'id' => 'transaction-' . $transaction->id,
                'type' => 'transaction_completed',
                'user' => [
                    'name' => $transaction->sender->name,
                    'email' => $transaction->sender->email
                ],
                'amount' => (float) $transaction->amount,
                'timestamp' => $transaction->created_at->toIso8601String(),
                'icon' => 'currency',
                'color' => 'green'
            ];
        }

        // Recent failed logins
        $recentFailedLogins = LoginLog::with('user')
            ->where('status', 'failed')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        foreach ($recentFailedLogins as $log) {
            if ($log->user) {
                $activity[] = [
                    'id' => 'login-' . $log->id,
                    'type' => 'login_failed',
                    'user' => [
                        'name' => $log->user->name,
                        'email' => $log->user->email
                    ],
                    'timestamp' => $log->created_at->toIso8601String(),
                    'icon' => 'lock',
                    'color' => 'red'
                ];
            }
        }

        // Sort all activity by timestamp
        usort($activity, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });

        return array_slice($activity, 0, 10);
    }

    /**
     * Get revenue trend data
     */
    public function revenueTrend(Request $request)
    {
        // Check permission
        if (!$request->user()->hasPermission('view-admin-dashboard')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $days = $request->input('days', 7);

        $trend = Transaction::where('status', 'completed')
            ->where('type', '!=', 'refund')
            ->where('created_at', '>=', now()->subDays($days))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(amount) as amount'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($trend);
    }

    /**
     * Get user growth data
     */
    public function userGrowth(Request $request)
    {
        // Check permission
        if (!$request->user()->hasPermission('view-admin-dashboard')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $days = $request->input('days', 30);

        $growth = User::where('created_at', '>=', now()->subDays($days))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($growth);
    }
}
