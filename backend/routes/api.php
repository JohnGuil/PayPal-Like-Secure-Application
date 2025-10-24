<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/2fa/verify-login', [TwoFactorController::class, 'verifyLogin']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Two-Factor Authentication routes
    Route::prefix('2fa')->group(function () {
        Route::post('/setup', [TwoFactorController::class, 'setup']);
        Route::post('/verify', [TwoFactorController::class, 'verify']);
        Route::post('/disable', [TwoFactorController::class, 'disable']);
    });

    // ========================================
    // RBAC (Role-Based Access Control) Routes
    // ========================================
    
    // Role management (Admin only)
    Route::middleware('role:admin,super-admin')->prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']); // List all roles
        Route::get('/{role}', [RoleController::class, 'show']); // Get specific role
        Route::post('/', [RoleController::class, 'store']); // Create role
        Route::put('/{role}', [RoleController::class, 'update']); // Update role
        Route::delete('/{role}', [RoleController::class, 'destroy']); // Delete role
        
        // Role assignment
        Route::post('/assign', [RoleController::class, 'assignToUser']); // Assign role to user
        Route::post('/revoke', [RoleController::class, 'revokeFromUser']); // Revoke role from user
    });

    // Permission management (Super Admin only)
    Route::middleware('role:super-admin')->prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index']); // List all permissions
        Route::get('/{permission}', [PermissionController::class, 'show']); // Get specific permission
        Route::post('/', [PermissionController::class, 'store']); // Create permission
        Route::put('/{permission}', [PermissionController::class, 'update']); // Update permission
        Route::delete('/{permission}', [PermissionController::class, 'destroy']); // Delete permission
    });

    // User management routes (permission-based)
    Route::middleware('permission:view-users')->get('/users', function (Request $request) {
        $users = \App\Models\User::with('roles')->paginate(20);
        return response()->json(['users' => $users], 200);
    });
});
