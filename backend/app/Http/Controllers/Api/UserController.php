<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of users
     */
    public function index(Request $request)
    {
        // Check permission
        if (!$request->user()->hasPermission('view-users')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = User::with(['roles', 'roles.permissions']);

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('mobile_number', 'LIKE', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->has('role')) {
            $query->whereHas('roles', function($q) use ($request) {
                $q->where('slug', $request->role);
            });
        }

        // Filter by 2FA status
        if ($request->has('two_factor_enabled')) {
            $query->where('two_factor_enabled', $request->two_factor_enabled);
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $users = $query->paginate($perPage);

        // Add primary_role to each user
        $users->getCollection()->transform(function ($user) {
            $user->primary_role = $user->roles->first();
            return $user;
        });

        return response()->json($users);
    }

    /**
     * Display the specified user
     */
    public function show(Request $request, $id)
    {
        // Check permission
        if (!$request->user()->hasPermission('view-users')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::with(['roles', 'roles.permissions'])->findOrFail($id);

        return response()->json($user);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        // Check permission
        if (!$request->user()->hasPermission('create-users')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'mobile_number' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'role_id' => 'sometimes|exists:roles,id',
            'role_ids' => 'sometimes|array',
            'role_ids.*' => 'exists:roles,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Create user
        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'mobile_number' => $request->mobile_number,
            'password' => Hash::make($request->password),
        ]);

        // Assign roles - handle both single role_id and array of role_ids
        if ($request->has('role_ids')) {
            $user->roles()->attach($request->role_ids);
        } elseif ($request->has('role_id')) {
            $user->roles()->attach([$request->role_id]);
        }

        // Load relationships
        $user->load(['roles', 'roles.permissions']);

        // Audit log for user creation
        AuditLogService::log(
            'user_created',
            'User',
            $user->id,
            "User created: " . $user->email . " by " . $request->user()->email,
            null,
            [
                'full_name' => $user->full_name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->toArray()
            ],
            $request
        );

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user
        ], 201);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, $id)
    {
        // Check permission
        if (!$request->user()->hasPermission('update-users')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        // Store old values for audit
        $oldValues = [
            'full_name' => $user->full_name,
            'email' => $user->email,
            'mobile_number' => $user->mobile_number
        ];

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id)
            ],
            'mobile_number' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'role_id' => 'sometimes|exists:roles,id',
            'role_ids' => 'sometimes|array',
            'role_ids.*' => 'exists:roles,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update user fields
        if ($request->has('full_name')) {
            $user->full_name = $request->full_name;
        }
        if ($request->has('email')) {
            $user->email = $request->email;
        }
        if ($request->has('mobile_number')) {
            $user->mobile_number = $request->mobile_number;
        }
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        // Update roles if provided - handle both single role_id and array of role_ids
        if ($request->has('role_ids')) {
            $user->roles()->sync($request->role_ids);
        } elseif ($request->has('role_id')) {
            $user->roles()->sync([$request->role_id]);
        }

        // Load relationships
        $user->load(['roles', 'roles.permissions']);

        // Audit log for user update
        AuditLogService::log(
            'user_updated',
            'User',
            $user->id,
            "User updated: " . $user->email . " by " . $request->user()->email,
            $oldValues,
            [
                'full_name' => $user->full_name,
                'email' => $user->email,
                'mobile_number' => $user->mobile_number,
                'roles' => $user->roles->pluck('name')->toArray()
            ],
            $request
        );

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Remove the specified user
     */
    public function destroy(Request $request, $id)
    {
        // Check permission
        if (!$request->user()->hasPermission('delete-users')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        // Prevent self-deletion
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot delete your own account'
            ], 403);
        }

        // Check if user is a super admin
        if ($user->hasRole('super-admin')) {
            return response()->json([
                'message' => 'Super Admin users cannot be deleted'
            ], 403);
        }

        // Store user data for audit before deletion
        $userData = [
            'full_name' => $user->full_name,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name')->toArray()
        ];

        $user->delete();

        // Audit log for user deletion
        AuditLogService::log(
            'user_deleted',
            'User',
            $id,
            "User deleted: " . $userData['email'] . " by " . $request->user()->email,
            $userData,
            null,
            $request
        );

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Update user profile (own profile)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        Log::info('Profile update request', [
            'user_id' => $user->id,
            'data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id)
            ],
            'mobile_number' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            Log::error('Profile update validation failed', [
                'errors' => $validator->errors()
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'mobile_number' => $request->mobile_number,
        ]);

        $user->load(['roles', 'roles.permissions']);

        Log::info('Profile updated successfully', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Update user password (own password)
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }
}
