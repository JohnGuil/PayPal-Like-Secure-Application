<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sender_id',
        'recipient_id',
        'amount',
        'currency',
        'type',
        'status',
        'description',
        'original_transaction_id',
        'reason',
        'is_refunded',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'float',
        'is_refunded' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the sender of the transaction.
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get the recipient of the transaction.
     */
    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    /**
     * Get the original transaction for refunds.
     */
    public function originalTransaction()
    {
        return $this->belongsTo(Transaction::class, 'original_transaction_id');
    }

    /**
     * Get refunds for this transaction.
     */
    public function refunds()
    {
        return $this->hasMany(Transaction::class, 'original_transaction_id');
    }

    /**
     * Check if transaction can be refunded.
     */
    public function canBeRefunded(): bool
    {
        return $this->status === 'completed' 
            && !$this->is_refunded 
            && $this->type !== 'refund';
    }

    /**
     * Check if this is a refund transaction.
     */
    public function isRefund(): bool
    {
        return $this->type === 'refund';
    }
}
