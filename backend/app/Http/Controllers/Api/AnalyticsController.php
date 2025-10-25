<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\LoginLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Get transaction analytics and statistics.
     */
    public function transactionAnalytics(Request $request)
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'period' => ['nullable', 'in:day,week,month,year'],
        ]);

        $startDate = isset($validated['start_date']) ? Carbon::parse($validated['start_date']) : Carbon::now()->subDays(30);
        $endDate = isset($validated['end_date']) ? Carbon::parse($validated['end_date']) : Carbon::now();
        $period = $validated['period'] ?? 'day';

        // Total transactions
        $totalTransactions = Transaction::whereBetween('created_at', [$startDate, $endDate])->count();
        
        // Total volume
        $totalVolume = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->sum('amount');

        // Transactions by type
        $transactionsByType = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->select('type', DB::raw('count(*) as count'), DB::raw('sum(amount) as total_amount'))
            ->groupBy('type')
            ->get();

        // Transactions by status
        $transactionsByStatus = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // Transaction trends (by period)
        // PostgreSQL date formatting
        $dateFormat = match($period) {
            'day' => 'YYYY-MM-DD',
            'week' => 'IYYY-IW',
            'month' => 'YYYY-MM',
            'year' => 'YYYY',
            default => 'YYYY-MM-DD',
        };

        $transactionTrends = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw("TO_CHAR(created_at, '{$dateFormat}') as period"),
                DB::raw('count(*) as count'),
                DB::raw('sum(amount) as total_amount')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // Top senders
        $topSenders = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('type', 'payment')
            ->select('sender_id', DB::raw('count(*) as transaction_count'), DB::raw('sum(amount) as total_sent'))
            ->groupBy('sender_id')
            ->orderBy('total_sent', 'desc')
            ->limit(10)
            ->with('sender:id,full_name,email')
            ->get();

        // Top recipients
        $topRecipients = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('type', 'payment')
            ->select('recipient_id', DB::raw('count(*) as transaction_count'), DB::raw('sum(amount) as total_received'))
            ->groupBy('recipient_id')
            ->orderBy('total_received', 'desc')
            ->limit(10)
            ->with('recipient:id,full_name,email')
            ->get();

        // Average transaction amount
        $avgTransactionAmount = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->avg('amount');

        // Refund rate
        $totalPayments = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('type', 'payment')
            ->count();
        $totalRefunds = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('type', 'refund')
            ->count();
        $refundRate = $totalPayments > 0 ? ($totalRefunds / $totalPayments) * 100 : 0;

        return response()->json([
            'summary' => [
                'total_transactions' => $totalTransactions,
                'total_volume' => number_format($totalVolume, 2),
                'average_amount' => number_format($avgTransactionAmount, 2),
                'refund_rate' => number_format($refundRate, 2) . '%',
            ],
            'by_type' => $transactionsByType,
            'by_status' => $transactionsByStatus,
            'trends' => $transactionTrends,
            'top_senders' => $topSenders,
            'top_recipients' => $topRecipients,
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'grouping' => $period,
            ],
        ]);
    }

    /**
     * Get user analytics and statistics.
     */
    public function userAnalytics(Request $request)
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $startDate = isset($validated['start_date']) ? Carbon::parse($validated['start_date']) : Carbon::now()->subDays(30);
        $endDate = isset($validated['end_date']) ? Carbon::parse($validated['end_date']) : Carbon::now();

        // Total users
        $totalUsers = User::count();
        
        // New users in period
        $newUsers = User::whereBetween('created_at', [$startDate, $endDate])->count();

        // Active users (users who logged in during period)
        $activeUsers = LoginLog::whereBetween('created_at', [$startDate, $endDate])
            ->distinct('user_id')
            ->count('user_id');

        // User registration trends (PostgreSQL)
        $registrationTrends = User::whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw("TO_CHAR(created_at, 'YYYY-MM-DD') as date"),
                DB::raw('count(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Users by role
        $usersByRole = DB::table('users')
            ->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->select('roles.name as role', DB::raw('count(*) as count'))
            ->groupBy('roles.name')
            ->get();

        // Login activity (PostgreSQL)
        $loginActivity = LoginLog::whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw("TO_CHAR(created_at, 'YYYY-MM-DD') as date"),
                DB::raw('count(*) as login_count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Most active users (by login count)
        $mostActiveUsers = LoginLog::whereBetween('created_at', [$startDate, $endDate])
            ->select('user_id', DB::raw('count(*) as login_count'))
            ->groupBy('user_id')
            ->orderBy('login_count', 'desc')
            ->limit(10)
            ->with('user:id,full_name,email')
            ->get();

        // Users with 2FA enabled
        $twoFactorStats = [
            'enabled' => User::where('two_factor_enabled', true)->count(),
            'disabled' => User::where('two_factor_enabled', false)->count(),
            'percentage' => $totalUsers > 0 ? number_format((User::where('two_factor_enabled', true)->count() / $totalUsers) * 100, 2) : 0,
        ];

        return response()->json([
            'summary' => [
                'total_users' => $totalUsers,
                'new_users' => $newUsers,
                'active_users' => $activeUsers,
                'growth_rate' => $totalUsers > 0 ? number_format(($newUsers / $totalUsers) * 100, 2) . '%' : '0%',
            ],
            'registration_trends' => $registrationTrends,
            'users_by_role' => $usersByRole,
            'login_activity' => $loginActivity,
            'most_active_users' => $mostActiveUsers,
            'two_factor_stats' => $twoFactorStats,
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Get financial analytics and statistics.
     */
    public function financialAnalytics(Request $request)
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $startDate = isset($validated['start_date']) ? Carbon::parse($validated['start_date']) : Carbon::now()->subDays(30);
        $endDate = isset($validated['end_date']) ? Carbon::parse($validated['end_date']) : Carbon::now();

        // Total money in system
        $totalBalance = User::sum('balance');

        // Money flow
        $moneyIn = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('type', 'payment')
            ->where('status', 'completed')
            ->sum('amount');

        $moneyOut = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('type', 'refund')
            ->where('status', 'completed')
            ->sum('amount');

        // Balance distribution
        $balanceRanges = [
            '0-100' => User::whereBetween('balance', [0, 100])->count(),
            '101-500' => User::whereBetween('balance', [101, 500])->count(),
            '501-1000' => User::whereBetween('balance', [501, 1000])->count(),
            '1001-5000' => User::whereBetween('balance', [1001, 5000])->count(),
            '5000+' => User::where('balance', '>', 5000)->count(),
        ];

        // Top balances
        $topBalances = User::orderBy('balance', 'desc')
            ->limit(10)
            ->select('id', 'full_name', 'email', 'balance', 'currency')
            ->get();

        // Revenue by currency
        $revenueByCurrency = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->select('currency', DB::raw('sum(amount) as total'))
            ->groupBy('currency')
            ->get();

        // Transaction success rate
        $totalAttempts = Transaction::whereBetween('created_at', [$startDate, $endDate])->count();
        $completedTransactions = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->count();
        $successRate = $totalAttempts > 0 ? ($completedTransactions / $totalAttempts) * 100 : 0;

        // Daily money flow (PostgreSQL)
        $dailyFlow = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->select(
                DB::raw("TO_CHAR(created_at, 'YYYY-MM-DD') as date"),
                DB::raw("SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as money_in"),
                DB::raw("SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END) as money_out")
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'summary' => [
                'total_balance_in_system' => number_format($totalBalance, 2),
                'money_in' => number_format($moneyIn, 2),
                'money_out' => number_format($moneyOut, 2),
                'net_flow' => number_format($moneyIn - $moneyOut, 2),
                'success_rate' => number_format($successRate, 2) . '%',
            ],
            'balance_distribution' => $balanceRanges,
            'top_balances' => $topBalances,
            'revenue_by_currency' => $revenueByCurrency,
            'daily_flow' => $dailyFlow,
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Get dashboard overview with key metrics.
     */
    public function dashboard()
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        // Today's stats
        $todayTransactions = Transaction::whereDate('created_at', $today)->count();
        $todayVolume = Transaction::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('amount');

        // Yesterday's stats for comparison
        $yesterdayTransactions = Transaction::whereDate('created_at', $yesterday)->count();
        $yesterdayVolume = Transaction::whereDate('created_at', $yesterday)
            ->where('status', 'completed')
            ->sum('amount');

        // Month stats
        $monthTransactions = Transaction::whereDate('created_at', '>=', $thisMonth)->count();
        $monthVolume = Transaction::whereDate('created_at', '>=', $thisMonth)
            ->where('status', 'completed')
            ->sum('amount');

        // Calculate growth
        $transactionGrowth = $yesterdayTransactions > 0 
            ? (($todayTransactions - $yesterdayTransactions) / $yesterdayTransactions) * 100 
            : 0;
        $volumeGrowth = $yesterdayVolume > 0 
            ? (($todayVolume - $yesterdayVolume) / $yesterdayVolume) * 100 
            : 0;

        // Active users today
        $activeUsersToday = LoginLog::whereDate('created_at', $today)
            ->distinct('user_id')
            ->count('user_id');

        // Recent transactions
        $recentTransactions = Transaction::with(['sender:id,full_name,email', 'recipient:id,full_name,email'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // System health metrics
        $startTime = microtime(true);
        try {
            DB::connection()->getPdo();
            $dbStatus = 'healthy';
            $dbResponseTime = round((microtime(true) - $startTime) * 1000, 2); // in ms
        } catch (\Exception $e) {
            $dbStatus = 'unhealthy';
            $dbResponseTime = 0;
        }

        // Calculate error rate from failed transactions
        $totalTransactionsAllTime = Transaction::count();
        $failedTransactions = Transaction::where('status', 'failed')->count();
        $errorRate = $totalTransactionsAllTime > 0 
            ? round(($failedTransactions / $totalTransactionsAllTime) * 100, 2)
            : 0;

        return response()->json([
            'today' => [
                'transactions' => $todayTransactions,
                'volume' => (float) $todayVolume,
                'active_users' => $activeUsersToday,
            ],
            'growth' => [
                'transactions' => round($transactionGrowth, 2),
                'volume' => round($volumeGrowth, 2),
            ],
            'this_month' => [
                'transactions' => $monthTransactions,
                'volume' => (float) $monthVolume,
            ],
            'recent_transactions' => $recentTransactions,
            'system' => [
                'total_users' => User::count(),
                'total_balance' => (float) User::sum('balance'),
                'pending_transactions' => Transaction::where('status', 'pending')->count(),
                'health' => [
                    'database' => $dbStatus,
                    'db_response_time' => $dbResponseTime,
                    'error_rate' => $errorRate,
                    'failed_transactions' => $failedTransactions,
                ],
            ],
        ]);
    }
}
