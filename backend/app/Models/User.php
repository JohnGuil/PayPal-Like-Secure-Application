<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'full_name',
        'email',
        'mobile_number',
        'password',
        'is_verified',
        'two_factor_secret',
        'two_factor_enabled',
        'last_login_at',
        'last_login_ip',
        'primary_role_id',
        'balance',
        'currency',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
            'two_factor_enabled' => 'boolean',
            'balance' => 'decimal:2',
        ];
    }

    /**
     * Accessor for 'name' - returns full_name for backward compatibility
     */
    public function getNameAttribute()
    {
        return $this->full_name;
    }

    /**
     * Get the login logs for the user.
     */
    public function loginLogs()
    {
        return $this->hasMany(LoginLog::class)->orderBy('created_at', 'desc');
    }

    /**
     * Get the recent login logs for the user.
     */
    public function recentLoginLogs($limit = 5)
    {
        return $this->loginLogs()->limit($limit)->get();
    }

    /**
     * ========================================
     * RBAC (Role-Based Access Control) Methods
     * ========================================
     */

        /**
     * Get the primary role of the user.
     */
    public function primaryRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'primary_role_id');
    }

    /**
     * Check if user has a specific permission (by slug or name).
     * Spatie's hasPermissionTo requires exact permission name, this adds slug support.
     */
    public function hasPermission(string|Permission $permission): bool
    {
        if ($permission instanceof Permission) {
            return $this->hasPermissionTo($permission->name);
        }

        // Try by name first, then by slug
        try {
            return $this->hasPermissionTo($permission);
        } catch (\Exception $e) {
            // Try finding by slug
            $perm = Permission::where('slug', $permission)->first();
            return $perm ? $this->hasPermissionTo($perm->name) : false;
        }
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole(['Admin', 'Super Admin']);
    }

    /**
     * Check if user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('Super Admin');
    }

    /**
     * ========================================
     * Balance Management Methods
     * ========================================
     */

    /**
     * Get the user's transactions as sender.
     */
    public function sentTransactions()
    {
        return $this->hasMany(Transaction::class, 'sender_id');
    }

    /**
     * Get the user's transactions as recipient.
     */
    public function receivedTransactions()
    {
        return $this->hasMany(Transaction::class, 'recipient_id');
    }

    /**
     * Check if user has sufficient balance for a transaction.
     */
    public function hasSufficientBalance(float $amount): bool
    {
        return $this->balance >= $amount;
    }

    /**
     * Deduct amount from user's balance.
     */
    public function deductBalance(float $amount): bool
    {
        if (!$this->hasSufficientBalance($amount)) {
            return false;
        }

        $this->balance -= $amount;
        return $this->save();
    }

    /**
     * Add amount to user's balance.
     */
    public function addBalance(float $amount): bool
    {
        $this->balance += $amount;
        return $this->save();
    }

    /**
     * Get formatted balance with currency symbol.
     */
    public function getFormattedBalanceAttribute(): string
    {
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'PHP' => '₱'
        ];

        $symbol = $symbols[$this->currency] ?? $this->currency . ' ';
        return $symbol . number_format($this->balance, 2);
    }
}
