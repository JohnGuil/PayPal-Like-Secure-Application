<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Models\LoginLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Generate a report based on type and parameters
     */
    public function generate(Request $request)
    {
        // Check permission (Super Admin only)
        if (!$request->user()->hasPermission('generate-reports')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validator = Validator::make($request->all(), [
            'report_type' => 'required|in:user-activity,transaction-summary,revenue-report,security-events',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'format' => 'sometimes|in:json,csv',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reportType = $request->report_type;
        $startDate = $request->start_date;
        $endDate = $request->end_date;
        $format = $request->input('format', 'json');

        // Generate report based on type
        switch ($reportType) {
            case 'user-activity':
                $data = $this->generateUserActivityReport($startDate, $endDate, $request);
                break;
            case 'transaction-summary':
                $data = $this->generateTransactionSummaryReport($startDate, $endDate, $request);
                break;
            case 'revenue-report':
                $data = $this->generateRevenueReport($startDate, $endDate, $request);
                break;
            case 'security-events':
                $data = $this->generateSecurityEventsReport($startDate, $endDate, $request);
                break;
            default:
                return response()->json(['message' => 'Invalid report type'], 400);
        }

        // Return in requested format
        if ($format === 'csv') {
            return $this->exportToCSV($data, $reportType);
        }

        return response()->json($data);
    }

    /**
     * Generate user activity report
     */
    private function generateUserActivityReport($startDate, $endDate, $request)
    {
        $query = User::query();

        // Filter by role if provided
        if ($request->has('role_id')) {
            $query->whereHas('roles', function($q) use ($request) {
                $q->where('roles.id', $request->role_id);
            });
        }

        $users = $query->withCount([
            'loginLogs as total_logins' => function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            },
            'loginLogs as successful_logins' => function($q) use ($startDate, $endDate) {
                $q->where('is_successful', true)
                  ->whereBetween('created_at', [$startDate, $endDate]);
            },
            'loginLogs as failed_logins' => function($q) use ($startDate, $endDate) {
                $q->where('is_successful', false)
                  ->whereBetween('created_at', [$startDate, $endDate]);
            }
        ])->get();

        // Get most active users
        $mostActiveUsers = $users->sortByDesc('total_logins')->take(10)->values();

        // Calculate average logins per user
        $averageLogins = $users->avg('total_logins');

        return [
            'report_type' => 'user-activity',
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'total_users' => $users->count(),
                'active_users' => $users->where('total_logins', '>', 0)->count(),
                'average_logins_per_user' => round($averageLogins, 2),
                'total_logins' => $users->sum('total_logins'),
                'successful_logins' => $users->sum('successful_logins'),
                'failed_logins' => $users->sum('failed_logins'),
            ],
            'most_active_users' => $mostActiveUsers->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->full_name,
                    'email' => $user->email,
                    'total_logins' => $user->total_logins,
                    'successful_logins' => $user->successful_logins,
                    'failed_logins' => $user->failed_logins,
                ];
            }),
        ];
    }

    /**
     * Generate transaction summary report
     */
    private function generateTransactionSummaryReport($startDate, $endDate, $request)
    {
        $query = Transaction::whereBetween('created_at', [$startDate, $endDate]);

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by type if provided
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $transactions = $query->get();

        // Group by status
        $byStatus = $transactions->groupBy('status')->map(function($group) {
            return [
                'count' => $group->count(),
                'total_amount' => $group->sum('amount'),
            ];
        });

        // Group by type
        $byType = $transactions->groupBy('type')->map(function($group) {
            return [
                'count' => $group->count(),
                'total_amount' => $group->sum('amount'),
            ];
        });

        // Daily breakdown
        $dailyBreakdown = $transactions->groupBy(function($item) {
            return $item->created_at->format('Y-m-d');
        })->map(function($group) {
            return [
                'count' => $group->count(),
                'total_amount' => $group->sum('amount'),
            ];
        });

        return [
            'report_type' => 'transaction-summary',
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'total_transactions' => $transactions->count(),
                'total_amount' => $transactions->sum('amount'),
                'average_transaction_amount' => round($transactions->avg('amount'), 2),
            ],
            'by_status' => $byStatus,
            'by_type' => $byType,
            'daily_breakdown' => $dailyBreakdown,
        ];
    }

    /**
     * Generate revenue report
     */
    private function generateRevenueReport($startDate, $endDate, $request)
    {
        $query = Transaction::where('status', 'completed')
            ->whereBetween('created_at', [$startDate, $endDate]);

        $transactions = $query->get();

        // Daily revenue
        $dailyRevenue = $transactions->groupBy(function($item) {
            return $item->created_at->format('Y-m-d');
        })->map(function($group) {
            return [
                'date' => $group->first()->created_at->format('Y-m-d'),
                'revenue' => $group->sum('amount'),
                'transaction_count' => $group->count(),
            ];
        })->values();

        // Top revenue users (senders)
        $topRevenueUsers = $transactions->groupBy('sender_id')->map(function($group) {
            $sender = $group->first()->sender;
            return [
                'user_id' => $group->first()->sender_id,
                'user_name' => $sender ? $sender->name : 'N/A',
                'user_email' => $sender ? $sender->email : 'N/A',
                'total_sent' => $group->sum('amount'),
                'transaction_count' => $group->count(),
            ];
        })->sortByDesc('total_sent')->take(10)->values();

        // Revenue by type
        $revenueByType = $transactions->groupBy('type')->map(function($group) {
            return [
                'type' => $group->first()->type,
                'revenue' => $group->sum('amount'),
                'count' => $group->count(),
            ];
        })->values();

        return [
            'report_type' => 'revenue-report',
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'total_revenue' => $transactions->sum('amount'),
                'total_transactions' => $transactions->count(),
                'average_revenue_per_day' => round($transactions->sum('amount') / max(1, $dailyRevenue->count()), 2),
                'average_transaction_value' => round($transactions->avg('amount'), 2),
            ],
            'daily_revenue' => $dailyRevenue,
            'top_revenue_users' => $topRevenueUsers,
            'revenue_by_type' => $revenueByType,
        ];
    }

    /**
     * Generate security events report
     */
    private function generateSecurityEventsReport($startDate, $endDate, $request)
    {
        $query = LoginLog::with(['user:id,full_name,email'])->whereBetween('created_at', [$startDate, $endDate]);

        $logs = $query->get();

        // Failed login attempts
        $failedLogins = $logs->where('is_successful', false);

        // Group failed logins by user
        $failedByUser = $failedLogins->groupBy('user_id')->map(function($group) {
            $user = $group->first()->user;
            return [
                'user_id' => $group->first()->user_id,
                'user_name' => $user ? $user->full_name : 'Unknown',
                'user_email' => $user ? $user->email : 'Unknown',
                'failed_attempts' => $group->count(),
            ];
        })->sortByDesc('failed_attempts')->take(10)->values();

        // Group by IP address
        $byIpAddress = $failedLogins->groupBy('ip_address')->map(function($group) {
            return [
                'ip_address' => $group->first()->ip_address,
                'failed_attempts' => $group->count(),
                'unique_users' => $group->pluck('user_id')->unique()->count(),
            ];
        })->sortByDesc('failed_attempts')->take(10)->values();

        // Daily breakdown
        $dailyBreakdown = $logs->groupBy(function($item) {
            return $item->created_at->format('Y-m-d');
        })->map(function($group) {
            return [
                'date' => $group->first()->created_at->format('Y-m-d'),
                'total_attempts' => $group->count(),
                'successful' => $group->where('is_successful', true)->count(),
                'failed' => $group->where('is_successful', false)->count(),
            ];
        })->values();

        // Suspicious patterns (multiple failed attempts in short time)
        $suspiciousActivity = $failedLogins->filter(function($log) use ($failedLogins) {
            // Count failed attempts from same IP in last hour
            $sameIpAttempts = $failedLogins->filter(function($l) use ($log) {
                return $l->ip_address === $log->ip_address 
                    && $l->created_at->between(
                        $log->created_at->copy()->subHour(),
                        $log->created_at
                    );
            });
            return $sameIpAttempts->count() >= 5; // 5 or more failed attempts in 1 hour
        })->unique('ip_address')->values();

        return [
            'report_type' => 'security-events',
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'summary' => [
                'total_login_attempts' => $logs->count(),
                'successful_logins' => $logs->where('is_successful', true)->count(),
                'failed_logins' => $failedLogins->count(),
                'unique_ips' => $logs->pluck('ip_address')->unique()->count(),
                'suspicious_ips' => $suspiciousActivity->count(),
            ],
            'failed_by_user' => $failedByUser,
            'failed_by_ip' => $byIpAddress,
            'daily_breakdown' => $dailyBreakdown,
            'suspicious_activity' => $suspiciousActivity->map(function($log) {
                return [
                    'ip_address' => $log->ip_address,
                    'timestamp' => $log->created_at->format('Y-m-d H:i:s'),
                    'user_agent' => $log->user_agent,
                ];
            }),
        ];
    }

    /**
     * Export report data to CSV
     */
    private function exportToCSV($data, $reportType)
    {
        $csvData = '';

        // Create CSV based on report type
        switch ($reportType) {
            case 'user-activity':
                $csvData = "User ID,Name,Email,Total Logins,Successful,Failed\n";
                foreach ($data['most_active_users'] as $user) {
                    $csvData .= sprintf(
                        "%d,\"%s\",\"%s\",%d,%d,%d\n",
                        $user['id'],
                        $user['name'],
                        $user['email'],
                        $user['total_logins'],
                        $user['successful_logins'],
                        $user['failed_logins']
                    );
                }
                break;

            case 'transaction-summary':
                $csvData = "Date,Transaction Count,Total Amount\n";
                foreach ($data['daily_breakdown'] as $date => $breakdown) {
                    $csvData .= sprintf(
                        "\"%s\",%d,%.2f\n",
                        $date,
                        $breakdown['count'],
                        $breakdown['total_amount']
                    );
                }
                break;

            case 'revenue-report':
                $csvData = "Date,Revenue,Transaction Count\n";
                foreach ($data['daily_revenue'] as $day) {
                    $csvData .= sprintf(
                        "\"%s\",%.2f,%d\n",
                        $day['date'],
                        $day['revenue'],
                        $day['transaction_count']
                    );
                }
                break;

            case 'security-events':
                $csvData = "Date,Total Attempts,Successful,Failed\n";
                foreach ($data['daily_breakdown'] as $day) {
                    $csvData .= sprintf(
                        "\"%s\",%d,%d,%d\n",
                        $day['date'],
                        $day['total_attempts'],
                        $day['successful'],
                        $day['failed']
                    );
                }
                break;
        }

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $reportType . '-' . date('Y-m-d') . '.csv"');
    }

    /**
     * Export raw transaction data
     */
    public function exportTransactions(Request $request)
    {
        // Check permission
        if (!$request->user()->hasPermission('generate-reports')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'sometimes|in:completed,pending,failed,cancelled',
            'type' => 'sometimes|in:payment,refund,transfer',
            'format' => 'sometimes|in:json,csv',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = Transaction::with(['sender:id,full_name,email', 'recipient:id,full_name,email'])
            ->whereBetween('created_at', [$request->start_date, $request->end_date]);

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Order by date descending
        $transactions = $query->orderBy('created_at', 'desc')->get();

        $format = $request->input('format', 'json');

        if ($format === 'csv') {
            return $this->exportTransactionsToCSV($transactions);
        }

        return response()->json([
            'status' => 'success',
            'data' => $transactions,
            'count' => $transactions->count()
        ]);
    }

    /**
     * Export raw login log data
     */
    public function exportLoginLogs(Request $request)
    {
        // Check permission
        if (!$request->user()->hasPermission('generate-reports')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_successful' => 'sometimes|boolean',
            'user_id' => 'sometimes|exists:users,id',
            'format' => 'sometimes|in:json,csv',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $query = LoginLog::with(['user:id,full_name,email'])
            ->whereBetween('created_at', [$request->start_date, $request->end_date]);

        // Apply filters
        if ($request->has('is_successful')) {
            $query->where('is_successful', $request->is_successful);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Order by date descending
        $logs = $query->orderBy('created_at', 'desc')->get();

        $format = $request->input('format', 'json');

        if ($format === 'csv') {
            return $this->exportLoginLogsToCSV($logs);
        }

        return response()->json([
            'status' => 'success',
            'data' => $logs,
            'count' => $logs->count()
        ]);
    }

    /**
     * Export transactions to CSV
     */
    private function exportTransactionsToCSV($transactions)
    {
        $csvData = "ID,Date,Type,Sender,Sender Email,Recipient,Recipient Email,Amount,Fee,Status,Description,Reference Number\n";

        foreach ($transactions as $transaction) {
            $csvData .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%.2f\",\"%.2f\",\"%s\",\"%s\",\"%s\"\n",
                $transaction->id,
                $transaction->created_at->format('Y-m-d H:i:s'),
                $transaction->type,
                $transaction->sender ? $transaction->sender->full_name : 'N/A',
                $transaction->sender ? $transaction->sender->email : 'N/A',
                $transaction->recipient ? $transaction->recipient->full_name : 'N/A',
                $transaction->recipient ? $transaction->recipient->email : 'N/A',
                $transaction->amount,
                $transaction->fee ?? 0,
                $transaction->status,
                str_replace('"', '""', $transaction->description ?? ''),
                $transaction->reference_number ?? ''
            );
        }

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="transactions-raw-' . date('Y-m-d') . '.csv"');
    }

    /**
     * Export login logs to CSV
     */
    private function exportLoginLogsToCSV($logs)
    {
        $csvData = "ID,Date,User,Email,IP Address,User Agent,Status,Failed Reason\n";

        foreach ($logs as $log) {
            $csvData .= sprintf(
                "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                $log->id,
                $log->created_at->format('Y-m-d H:i:s'),
                $log->user ? $log->user->full_name : 'Unknown',
                $log->user ? $log->user->email : 'N/A',
                $log->ip_address,
                str_replace('"', '""', $log->user_agent ?? ''),
                $log->is_successful ? 'Success' : 'Failed',
                str_replace('"', '""', $log->failed_reason ?? '')
            );
        }

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="login-logs-raw-' . date('Y-m-d') . '.csv"');
    }
}

