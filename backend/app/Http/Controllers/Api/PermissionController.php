<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * Get all permissions.
     */
    public function index(Request $request)
    {
        $permissions = Permission::query()
            ->when($request->has('resource'), function ($query) use ($request) {
                $query->where('resource', $request->input('resource'));
            })
            ->orderBy('resource')
            ->orderBy('action')
            ->get();

        // Group permissions by resource
        $groupedPermissions = $permissions->groupBy('resource')->map(function ($group) {
            return $group->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'slug' => $permission->slug,
                    'description' => $permission->description,
                    'action' => $permission->action,
                ];
            });
        });

        return response()->json([
            'permissions' => $permissions,
            'grouped_permissions' => $groupedPermissions,
        ], 200);
    }

    /**
     * Get a specific permission.
     */
    public function show(Permission $permission)
    {
        $permission->load('roles');

        return response()->json([
            'permission' => [
                'id' => $permission->id,
                'name' => $permission->name,
                'slug' => $permission->slug,
                'description' => $permission->description,
                'resource' => $permission->resource,
                'action' => $permission->action,
                'roles' => $permission->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'slug' => $role->slug,
                    ];
                }),
            ],
        ], 200);
    }

    /**
     * Create a new permission.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
            'slug' => ['required', 'string', 'max:255', 'unique:permissions,slug'],
            'description' => ['nullable', 'string', 'max:500'],
            'resource' => ['required', 'string', 'max:100'],
            'action' => ['required', 'string', 'max:100'],
        ]);

        $permission = Permission::create($validated);

        return response()->json([
            'message' => 'Permission created successfully!',
            'permission' => $permission,
        ], 201);
    }

    /**
     * Update a permission.
     */
    public function update(Request $request, Permission $permission)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:permissions,name,' . $permission->id],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:permissions,slug,' . $permission->id],
            'description' => ['nullable', 'string', 'max:500'],
            'resource' => ['sometimes', 'string', 'max:100'],
            'action' => ['sometimes', 'string', 'max:100'],
        ]);

        $permission->update($validated);

        return response()->json([
            'message' => 'Permission updated successfully!',
            'permission' => $permission,
        ], 200);
    }

    /**
     * Delete a permission.
     */
    public function destroy(Permission $permission)
    {
        // Check if permission is assigned to any roles
        if ($permission->roles()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete permission assigned to roles. Please remove from roles first.',
                'roles_count' => $permission->roles()->count(),
            ], 422);
        }

        $permission->delete();

        return response()->json([
            'message' => 'Permission deleted successfully!',
        ], 200);
    }
}
