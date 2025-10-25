<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionStatusRequest;
use App\Http\Requests\RefundTransactionRequest;
use App\Models\Transaction;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionController extends Controller
{
    /**
     * Display a listing of transactions
     */
    public function index(Request $request)
    {
        // Check permission - allow either view-transactions or view-all-transactions
        if (!$request->user()->hasPermission('view-transactions') && 
            !$request->user()->hasPermission('view-all-transactions')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Transaction::with(['sender', 'recipient']);

        // If user doesn't have view-all permission, only show their transactions
        if (!$request->user()->hasPermission('view-all-transactions')) {
            $query->where(function($q) use ($request) {
                $q->where('sender_id', $request->user()->id)
                  ->orWhere('recipient_id', $request->user()->id);
            });
        }

        // Filter by type (sent/received for current user)
        if ($request->has('filter') && $request->filter !== 'all') {
            if ($request->filter === 'sent') {
                $query->where('sender_id', $request->user()->id);
            } elseif ($request->filter === 'received') {
                $query->where('recipient_id', $request->user()->id);
            }
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by transaction type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('description', 'LIKE', "%{$search}%")
                  ->orWhere('amount', 'LIKE', "%{$search}%")
                  ->orWhereHas('sender', function($q) use ($search) {
                      $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('email', 'LIKE', "%{$search}%");
                  })
                  ->orWhereHas('recipient', function($q) use ($search) {
                      $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('email', 'LIKE', "%{$search}%");
                  });
            });
        }

        // Order by latest first
        $query->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->input('per_page', 15);
        $transactions = $query->paginate($perPage);

        return response()->json($transactions);
    }

    /**
     * Display the specified transaction
     */
    public function show(Request $request, $id)
    {
        // Check permission - allow either view-transactions or view-all-transactions
        if (!$request->user()->hasPermission('view-transactions') && 
            !$request->user()->hasPermission('view-all-transactions')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $transaction = Transaction::with(['sender', 'recipient'])->findOrFail($id);

        // Check if user has access to this transaction
        if (!$request->user()->hasPermission('view-all-transactions')) {
            if ($transaction->sender_id !== $request->user()->id && 
                $transaction->recipient_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json($transaction);
    }

    /**
     * Store a newly created transaction
     */
    public function store(StoreTransactionRequest $request)
    {
        // Validation and authorization already handled by FormRequest

        // Find recipient
        $recipient = User::where('email', $request->recipient_email)->first();

        // Prevent self-transaction (double check even though FormRequest validates)
        if ($recipient->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot send money to yourself'
            ], 422);
        }

        // Check if sender has sufficient balance
        if (!$request->user()->hasSufficientBalance($request->amount)) {
            return response()->json([
                'message' => 'Insufficient balance',
                'current_balance' => $request->user()->balance,
                'required_amount' => $request->amount
            ], 422);
        }

        try {
            // Use database transaction for atomicity
            $transaction = DB::transaction(function () use ($request, $recipient) {
                // Create transaction record as pending
                $transaction = Transaction::create([
                    'sender_id' => $request->user()->id,
                    'recipient_id' => $recipient->id,
                    'amount' => $request->amount,
                    'currency' => $request->input('currency', 'USD'),
                    'type' => $request->type,
                    'description' => $request->description,
                    'status' => 'pending',
                ]);

                // Deduct from sender
                if (!$request->user()->deductBalance($request->amount)) {
                    throw new \Exception('Failed to deduct balance from sender');
                }

                // Add to recipient
                if (!$recipient->addBalance($request->amount)) {
                    throw new \Exception('Failed to add balance to recipient');
                }

                // Mark transaction as completed
                $transaction->update(['status' => 'completed']);

                return $transaction;
            });

            // Load relationships
            $transaction->load(['sender', 'recipient']);

            // Audit log for transaction creation
            AuditLogService::log(
                'transaction_created',
                'Transaction',
                $transaction->id,
                "Transaction created: $" . $transaction->amount . " from " . $transaction->sender->email . " to " . $transaction->recipient->email,
                null,
                [
                    'amount' => $transaction->amount,
                    'type' => $transaction->type,
                    'sender_id' => $transaction->sender_id,
                    'recipient_id' => $transaction->recipient_id,
                    'status' => $transaction->status
                ],
                $request
            );

            Log::info('Transaction completed', [
                'transaction_id' => $transaction->id,
                'sender_id' => $request->user()->id,
                'recipient_id' => $recipient->id,
                'amount' => $request->amount
            ]);

            return response()->json([
                'message' => 'Transaction completed successfully',
                'transaction' => $transaction,
                'sender_balance' => $request->user()->fresh()->balance
            ], 201);

        } catch (\Exception $e) {
            Log::error('Transaction failed', [
                'error' => $e->getMessage(),
                'sender_id' => $request->user()->id,
                'recipient_email' => $request->recipient_email
            ]);

            return response()->json([
                'message' => 'Transaction failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update transaction status (admin only)
     */
    public function updateStatus(UpdateTransactionStatusRequest $request, $id)
    {
        // Validation and authorization already handled by FormRequest

        $transaction = Transaction::findOrFail($id);
        
        // Store old status for logging
        $oldStatus = $transaction->status;

        $transaction->update([
            'status' => $request->status,
            'reason' => $request->reason
        ]);
        
        $transaction->load(['sender', 'recipient']);

        Log::info('Transaction status updated', [
            'transaction_id' => $id,
            'old_status' => $oldStatus,
            'new_status' => $request->status,
            'updated_by' => $request->user()->id
        ]);

        return response()->json([
            'message' => 'Transaction status updated successfully',
            'transaction' => $transaction
        ]);
    }

    /**
     * Refund a transaction
     */
    public function refund(RefundTransactionRequest $request, $id)
    {
        // Validation and authorization already handled by FormRequest

        $originalTransaction = Transaction::with(['sender', 'recipient'])->findOrFail($id);

        // Verify transaction can be refunded
        if (!$originalTransaction->canBeRefunded()) {
            return response()->json([
                'message' => 'This transaction cannot be refunded',
                'reason' => $originalTransaction->is_refunded 
                    ? 'Transaction already refunded' 
                    : 'Transaction not completed or is already a refund'
            ], 422);
        }

        // Check if user is authorized (must be sender, recipient, or admin)
        $user = $request->user();
        $isParticipant = $originalTransaction->sender_id === $user->id 
                      || $originalTransaction->recipient_id === $user->id;
        $isAdmin = $user->hasPermission('view-all-transactions');

        if (!$isParticipant && !$isAdmin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if recipient has sufficient balance for refund
        if (!$originalTransaction->recipient->hasSufficientBalance($originalTransaction->amount)) {
            return response()->json([
                'message' => 'Refund failed: Recipient has insufficient balance',
                'current_balance' => $originalTransaction->recipient->balance,
                'required_amount' => $originalTransaction->amount
            ], 422);
        }

        try {
            // Use database transaction for atomicity
            $refundTransaction = DB::transaction(function () use ($request, $originalTransaction) {
                // Create refund transaction
                $refundTransaction = Transaction::create([
                    'sender_id' => $originalTransaction->recipient_id, // Reversed
                    'recipient_id' => $originalTransaction->sender_id, // Reversed
                    'amount' => $originalTransaction->amount,
                    'currency' => $originalTransaction->currency,
                    'type' => 'refund',
                    'status' => 'pending',
                    'description' => 'Refund: ' . $originalTransaction->description,
                    'original_transaction_id' => $originalTransaction->id,
                    'reason' => $request->reason,
                ]);

                // Deduct from original recipient (now sender)
                if (!$originalTransaction->recipient->deductBalance($originalTransaction->amount)) {
                    throw new \Exception('Failed to deduct balance from recipient');
                }

                // Add back to original sender (now recipient)
                if (!$originalTransaction->sender->addBalance($originalTransaction->amount)) {
                    throw new \Exception('Failed to return balance to sender');
                }

                // Mark refund as completed
                $refundTransaction->update(['status' => 'completed']);

                // Mark original transaction as refunded
                $originalTransaction->update(['is_refunded' => true]);

                return $refundTransaction;
            });

            // Load relationships
            $refundTransaction->load(['sender', 'recipient', 'originalTransaction']);

            // Audit log for refund
            AuditLogService::log(
                'transaction_refunded',
                'Transaction',
                $originalTransaction->id,
                "Transaction refunded: $" . $originalTransaction->amount . " - Original ID: " . $originalTransaction->id,
                ['is_refunded' => false, 'status' => $originalTransaction->status],
                ['is_refunded' => true, 'refund_reason' => $request->reason],
                $request
            );

            Log::info('Transaction refunded', [
                'original_transaction_id' => $originalTransaction->id,
                'refund_transaction_id' => $refundTransaction->id,
                'amount' => $originalTransaction->amount,
                'initiated_by' => $request->user()->id
            ]);

            return response()->json([
                'message' => 'Transaction refunded successfully',
                'refund_transaction' => $refundTransaction,
                'original_transaction' => $originalTransaction->fresh()
            ], 201);

        } catch (\Exception $e) {
            Log::error('Refund failed', [
                'error' => $e->getMessage(),
                'transaction_id' => $originalTransaction->id,
                'initiated_by' => $request->user()->id
            ]);

            return response()->json([
                'message' => 'Refund failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get transaction statistics
     */
    public function statistics(Request $request)
    {
        // Check permission - allow either view-transactions or view-all-transactions
        if (!$request->user()->hasPermission('view-transactions') && 
            !$request->user()->hasPermission('view-all-transactions')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Transaction::query();

        // If user doesn't have view-all permission, only show their transactions
        if (!$request->user()->hasPermission('view-all-transactions')) {
            $query->where(function($q) use ($request) {
                $q->where('sender_id', $request->user()->id)
                  ->orWhere('recipient_id', $request->user()->id);
            });
        }

        $stats = [
            'total' => $query->count(),
            'completed' => $query->where('status', 'completed')->count(),
            'pending' => $query->where('status', 'pending')->count(),
            'failed' => $query->where('status', 'failed')->count(),
            'cancelled' => $query->where('status', 'cancelled')->count(),
            'total_amount' => $query->where('status', 'completed')->sum('amount'),
            'by_type' => [
                'payment' => $query->where('type', 'payment')->count(),
                'refund' => $query->where('type', 'refund')->count(),
                'transfer' => $query->where('type', 'transfer')->count(),
            ]
        ];

        return response()->json($stats);
    }
}
