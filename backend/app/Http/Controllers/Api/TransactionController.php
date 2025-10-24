<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

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
    public function store(Request $request)
    {
        // Check permission
        if (!$request->user()->hasPermission('create-transactions')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'recipient_email' => 'required|email|exists:users,email',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:payment,refund,transfer',
            'description' => 'nullable|string|max:500',
            'currency' => 'nullable|string|size:3'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find recipient
        $recipient = User::where('email', $request->recipient_email)->first();

        // Prevent self-transaction
        if ($recipient->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot send money to yourself'
            ], 422);
        }

        // Create transaction
        $transaction = Transaction::create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $recipient->id,
            'amount' => $request->amount,
            'currency' => $request->input('currency', 'USD'),
            'type' => $request->type,
            'description' => $request->description,
            'status' => 'pending', // Start as pending
        ]);

        // In a real application, you would process the payment here
        // For now, we'll just mark it as completed
        $transaction->update(['status' => 'completed']);

        // Load relationships
        $transaction->load(['sender', 'recipient']);

        return response()->json([
            'message' => 'Transaction created successfully',
            'transaction' => $transaction
        ], 201);
    }

    /**
     * Update transaction status (admin only)
     */
    public function updateStatus(Request $request, $id)
    {
        // Check permission
        if (!$request->user()->hasPermission('update-transactions')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,completed,failed,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $transaction = Transaction::findOrFail($id);
        $transaction->update(['status' => $request->status]);
        $transaction->load(['sender', 'recipient']);

        return response()->json([
            'message' => 'Transaction status updated successfully',
            'transaction' => $transaction
        ]);
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
