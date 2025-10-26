<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * Spatie handles name and guard_name, we add our custom fields.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'level',
        'is_active',
        'guard_name', // Required by Spatie
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
     * Override Spatie's users() method to explicitly specify the User model.
     * This fixes the "Class name must be a valid object or a string" error.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function users(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->morphedByMany(
            \App\Models\User::class,
            'model',
            'model_has_roles',
            'role_id',
            'model_id'
        );
    }

    /**
     * Check if role has a specific permission (supports slug).
     * Spatie's hasPermissionTo requires exact permission name.
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
}
