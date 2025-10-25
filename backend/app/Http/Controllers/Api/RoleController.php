<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RoleController extends Controller
{
    /**
     * Get all roles with their permissions.
     */
    public function index(Request $request)
    {
        $roles = Role::with('permissions')
            ->when($request->has('active'), function ($query) use ($request) {
                $query->where('is_active', $request->boolean('active'));
            })
            ->orderBy('level', 'desc')
            ->get();

        return response()->json([
            'roles' => $roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'description' => $role->description,
                    'level' => $role->level,
                    'is_active' => $role->is_active,
                    'permissions_count' => $role->permissions->count(),
                    'permissions' => $role->permissions->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                            'slug' => $permission->slug,
                            'resource' => $permission->resource,
                            'action' => $permission->action,
                        ];
                    }),
                ];
            }),
        ], 200);
    }

    /**
     * Get a specific role.
     */
    public function show(Role $role)
    {
        $role->load('permissions', 'users');

        return response()->json([
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'level' => $role->level,
                'is_active' => $role->is_active,
                'permissions' => $role->permissions,
                'users_count' => $role->users->count(),
            ],
        ], 200);
    }

    /**
     * Create a new role.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
            'slug' => ['required', 'string', 'max:255', 'unique:roles,slug'],
            'description' => ['nullable', 'string', 'max:500'],
            'level' => ['required', 'integer', 'min:1', 'max:99'], // Max 99, 100 reserved for super-admin
            'is_active' => ['boolean'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,slug'],
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $validated['description'] ?? null,
            'level' => $validated['level'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if (isset($validated['permissions'])) {
            // Use web guard since permissions are created with 'web' guard
            $permissions = collect($validated['permissions'])->map(function($slug) {
                return Permission::where('slug', $slug)->where('guard_name', 'web')->first();
            })->filter();
            
            $role->syncPermissions($permissions);
        }

        // Log role creation
        AuditLogService::log(
            'role_created',
            'Role',
            $role->id,
            'Role created: ' . $role->name . ' (' . $role->slug . ')',
            null,
            [
                'name' => $role->name,
                'slug' => $role->slug,
                'level' => $role->level,
                'permissions' => $validated['permissions'] ?? []
            ],
            $request
        );

        return response()->json([
            'message' => 'Role created successfully!',
            'role' => $role->load('permissions'),
        ], 201);
    }

    /**
     * Update a role.
     */
    public function update(Request $request, Role $role)
    {
        // Prevent modifying super-admin role
        if ($role->slug === 'super-admin') {
            return response()->json([
                'message' => 'Cannot modify super-admin role.',
            ], 403);
        }

        // Capture old values before update
        $oldValues = [
            'name' => $role->name,
            'slug' => $role->slug,
            'level' => $role->level,
            'is_active' => $role->is_active,
            'permissions' => $role->permissions->pluck('slug')->toArray()
        ];

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:roles,slug,' . $role->id],
            'description' => ['nullable', 'string', 'max:500'],
            'level' => ['sometimes', 'integer', 'min:1', 'max:99'],
            'is_active' => ['boolean'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,slug'],
        ]);

        $role->update(array_filter([
            'name' => $validated['name'] ?? $role->name,
            'slug' => $validated['slug'] ?? $role->slug,
            'description' => $validated['description'] ?? $role->description,
            'level' => $validated['level'] ?? $role->level,
            'is_active' => $validated['is_active'] ?? $role->is_active,
        ]));

        if (isset($validated['permissions'])) {
            // Use web guard since permissions are created with 'web' guard
            $permissions = collect($validated['permissions'])->map(function($slug) {
                return Permission::where('slug', $slug)->where('guard_name', 'web')->first();
            })->filter();
            
            $role->syncPermissions($permissions);
        }

        // Log role update with before/after state
        AuditLogService::log(
            'role_updated',
            'Role',
            $role->id,
            'Role updated: ' . $role->name,
            $oldValues,
            [
                'name' => $role->name,
                'slug' => $role->slug,
                'level' => $role->level,
                'is_active' => $role->is_active,
                'permissions' => $validated['permissions'] ?? $role->permissions->pluck('slug')->toArray()
            ],
            $request
        );

        return response()->json([
            'message' => 'Role updated successfully!',
            'role' => $role->load('permissions'),
        ], 200);
    }

    /**
     * Delete a role.
     */
    public function destroy(Role $role)
    {
        // Prevent deleting system roles
        if (in_array($role->slug, ['super-admin', 'admin', 'user'])) {
            return response()->json([
                'message' => 'Cannot delete system role.',
            ], 403);
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete role with assigned users. Please reassign users first.',
                'users_count' => $role->users()->count(),
            ], 422);
        }

        // Preserve role data before deletion for audit log
        $roleData = [
            'name' => $role->name,
            'slug' => $role->slug,
            'level' => $role->level,
            'permissions' => $role->permissions->pluck('slug')->toArray()
        ];

        $role->delete();

        // Log role deletion
        AuditLogService::log(
            'role_deleted',
            'Role',
            $role->id,
            'Role deleted: ' . $roleData['name'] . ' (' . $roleData['slug'] . ')',
            $roleData,
            null,
            request()
        );

        return response()->json([
            'message' => 'Role deleted successfully!',
        ], 200);
    }

    /**
     * Assign role to user.
     */
    public function assignToUser(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role_slug' => ['required', 'exists:roles,slug'],
            'set_as_primary' => ['boolean'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        $role = Role::where('slug', $validated['role_slug'])->firstOrFail();

        // Assign role
        $user->assignRole($role, $request->user()->id);

        // Set as primary role if requested
        if ($validated['set_as_primary'] ?? false) {
            $user->update(['primary_role_id' => $role->id]);
        }

        // Log role assignment
        AuditLogService::log(
            'role_assigned',
            'User',
            $user->id,
            'Role "' . $role->name . '" assigned to user: ' . $user->email,
            null,
            [
                'role' => $role->slug,
                'is_primary' => $validated['set_as_primary'] ?? false,
                'user_email' => $user->email
            ],
            $request
        );

        return response()->json([
            'message' => 'Role assigned successfully!',
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
            ],
        ], 200);
    }

    /**
     * Revoke role from user.
     */
    public function revokeFromUser(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'role_slug' => ['required', 'exists:roles,slug'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        $role = Role::where('slug', $validated['role_slug'])->firstOrFail();

        // Prevent removing last role
        if ($user->roles()->count() === 1 && $user->hasRole($role)) {
            return response()->json([
                'message' => 'Cannot remove the only role from user. Assign another role first.',
            ], 422);
        }

        $user->removeRole($role);

        // If this was the primary role, set another role as primary
        if ($user->primary_role_id === $role->id) {
            $newPrimaryRole = $user->roles()->first();
            $user->update(['primary_role_id' => $newPrimaryRole?->id]);
        }

        // Log role revocation
        AuditLogService::log(
            'role_revoked',
            'User',
            $user->id,
            'Role "' . $role->name . '" revoked from user: ' . $user->email,
            [
                'role' => $role->slug,
                'user_email' => $user->email
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Role revoked successfully!',
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
            ],
        ], 200);
    }
}
