<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'level',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'level' => 'integer',
        ];
    }

    /**
     * The users that belong to the role.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_user')
            ->withTimestamps()
            ->withPivot('assigned_at', 'assigned_by');
    }

    /**
     * The permissions that belong to the role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role')
            ->withTimestamps();
    }

    /**
     * Check if role has a specific permission.
     */
    public function hasPermission(string|Permission $permission): bool
    {
        if (is_string($permission)) {
            return $this->permissions->contains('slug', $permission) ||
                   $this->permissions->contains('name', $permission);
        }

        return $this->permissions->contains($permission);
    }

    /**
     * Check if role has any of the given permissions.
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
     * Check if role has all of the given permissions.
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
     * Give permission(s) to the role.
     */
    public function givePermissionTo(string|int|array|Permission $permissions): self
    {
        $permissions = is_array($permissions) ? $permissions : [$permissions];

        foreach ($permissions as $permission) {
            if (is_string($permission)) {
                $permission = Permission::where('slug', $permission)
                    ->orWhere('name', $permission)
                    ->firstOrFail();
            } elseif (is_int($permission)) {
                $permission = Permission::findOrFail($permission);
            }

            if (!$this->hasPermission($permission)) {
                $this->permissions()->attach($permission->id);
            }
        }

        return $this;
    }

    /**
     * Revoke permission(s) from the role.
     */
    public function revokePermissionTo(string|int|array|Permission $permissions): self
    {
        $permissions = is_array($permissions) ? $permissions : [$permissions];

        foreach ($permissions as $permission) {
            if (is_string($permission)) {
                $permission = Permission::where('slug', $permission)
                    ->orWhere('name', $permission)
                    ->first();
            } elseif (is_int($permission)) {
                $permission = Permission::find($permission);
            }

            if ($permission && $this->hasPermission($permission)) {
                $this->permissions()->detach($permission->id);
            }
        }

        return $this;
    }

    /**
     * Sync permissions for the role.
     */
    public function syncPermissions(array $permissions): self
    {
        $permissionIds = [];

        foreach ($permissions as $permission) {
            if (is_string($permission)) {
                $perm = Permission::where('slug', $permission)
                    ->orWhere('name', $permission)
                    ->first();
                if ($perm) {
                    $permissionIds[] = $perm->id;
                }
            } elseif (is_int($permission)) {
                $permissionIds[] = $permission;
            } elseif ($permission instanceof Permission) {
                $permissionIds[] = $permission->id;
            }
        }

        $this->permissions()->sync($permissionIds);

        return $this;
    }
}
