<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

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
        ];
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
     * Get the roles assigned to the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user')
            ->withTimestamps()
            ->withPivot('assigned_at', 'assigned_by');
    }

    /**
     * Get the primary role of the user.
     */
    public function primaryRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'primary_role_id');
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string|int|Role $role): bool
    {
        if (is_string($role)) {
            return $this->roles->contains('slug', $role) ||
                   $this->roles->contains('name', $role);
        }

        if (is_int($role)) {
            return $this->roles->contains('id', $role);
        }

        return $this->roles->contains($role);
    }

    /**
     * Check if user has any of the given roles.
     */
    public function hasAnyRole(array $roles): bool
    {
        foreach ($roles as $role) {
            if ($this->hasRole($role)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has all of the given roles.
     */
    public function hasAllRoles(array $roles): bool
    {
        foreach ($roles as $role) {
            if (!$this->hasRole($role)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission(string|Permission $permission): bool
    {
        foreach ($this->roles as $role) {
            if ($role->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Assign role(s) to the user.
     */
    public function assignRole(string|int|array|Role $roles, ?int $assignedBy = null): self
    {
        $roles = is_array($roles) ? $roles : [$roles];

        foreach ($roles as $role) {
            if (is_string($role)) {
                $role = Role::where('slug', $role)
                    ->orWhere('name', $role)
                    ->firstOrFail();
            } elseif (is_int($role)) {
                $role = Role::findOrFail($role);
            }

            if (!$this->hasRole($role)) {
                $this->roles()->attach($role->id, [
                    'assigned_at' => now(),
                    'assigned_by' => $assignedBy,
                ]);
            }
        }

        // Refresh roles relationship
        $this->load('roles');

        return $this;
    }

    /**
     * Remove role(s) from the user.
     */
    public function removeRole(string|int|array|Role $roles): self
    {
        $roles = is_array($roles) ? $roles : [$roles];

        foreach ($roles as $role) {
            if (is_string($role)) {
                $role = Role::where('slug', $role)
                    ->orWhere('name', $role)
                    ->first();
            } elseif (is_int($role)) {
                $role = Role::find($role);
            }

            if ($role && $this->hasRole($role)) {
                $this->roles()->detach($role->id);
            }
        }

        // Refresh roles relationship
        $this->load('roles');

        return $this;
    }

    /**
     * Sync roles for the user.
     */
    public function syncRoles(array $roles, ?int $assignedBy = null): self
    {
        $roleIds = [];

        foreach ($roles as $role) {
            if (is_string($role)) {
                $r = Role::where('slug', $role)
                    ->orWhere('name', $role)
                    ->first();
                if ($r) {
                    $roleIds[$r->id] = [
                        'assigned_at' => now(),
                        'assigned_by' => $assignedBy,
                    ];
                }
            } elseif (is_int($role)) {
                $roleIds[$role] = [
                    'assigned_at' => now(),
                    'assigned_by' => $assignedBy,
                ];
            } elseif ($role instanceof Role) {
                $roleIds[$role->id] = [
                    'assigned_at' => now(),
                    'assigned_by' => $assignedBy,
                ];
            }
        }

        $this->roles()->sync($roleIds);

        // Refresh roles relationship
        $this->load('roles');

        return $this;
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin') || $this->hasRole('super-admin');
    }

    /**
     * Check if user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super-admin');
    }

    /**
     * Get all permissions for the user through their roles.
     */
    public function getAllPermissions()
    {
        return $this->roles->flatMap(function ($role) {
            return $role->permissions;
        })->unique('id');
    }
}
