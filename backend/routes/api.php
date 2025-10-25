<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\LoginLogController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AnalyticsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes (Rate limited to prevent brute force attacks)
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:login');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/2fa/verify-login', [TwoFactorController::class, 'verifyLogin'])->middleware('throttle:login');

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
    
    // Role management (Permission checked in controller)
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']); // List all roles
        Route::get('/{role}', [RoleController::class, 'show']); // Get specific role
        Route::post('/', [RoleController::class, 'store']); // Create role
        Route::put('/{role}', [RoleController::class, 'update']); // Update role
        Route::delete('/{role}', [RoleController::class, 'destroy']); // Delete role
        
        // Role assignment
        Route::post('/assign', [RoleController::class, 'assignToUser']); // Assign role to user
        Route::post('/revoke', [RoleController::class, 'revokeFromUser']); // Revoke role from user
    });

    // Permission management (Permission checked in controller)
    Route::prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index']); // List all permissions
        Route::get('/{permission}', [PermissionController::class, 'show']); // Get specific permission
        Route::post('/', [PermissionController::class, 'store']); // Create permission
        Route::put('/{permission}', [PermissionController::class, 'update']); // Update permission
        Route::delete('/{permission}', [PermissionController::class, 'destroy']); // Delete permission
    });

    // User management routes (Permission checked in controller)
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']); // List users
        Route::get('/{id}', [UserController::class, 'show']); // Show single user
        Route::post('/', [UserController::class, 'store']); // Create user
        Route::put('/{id}', [UserController::class, 'update']); // Update user
        Route::delete('/{id}', [UserController::class, 'destroy']); // Delete user
    });

    // User profile management (self-service)
    Route::prefix('user')->group(function () {
        Route::put('/profile', [UserController::class, 'updateProfile']); // Update own profile
        Route::put('/password', [UserController::class, 'updatePassword']); // Change own password
    });

    // Transaction management (Permission checked in controller)
    Route::prefix('transactions')->group(function () {
        Route::get('/', [TransactionController::class, 'index']); // List transactions
        Route::get('/statistics', [TransactionController::class, 'statistics']); // Get statistics
        Route::get('/{id}', [TransactionController::class, 'show']); // Show single transaction
        Route::post('/', [TransactionController::class, 'store']); // Create transaction
        Route::post('/{id}/refund', [TransactionController::class, 'refund']); // Refund transaction
        Route::put('/{id}/status', [TransactionController::class, 'updateStatus']); // Update status
    });

    // Login logs (Permission checked in controller)
    Route::prefix('login-logs')->group(function () {
        Route::get('/', [LoginLogController::class, 'index']); // List login logs
        Route::get('/statistics', [LoginLogController::class, 'statistics']); // Get statistics
        Route::get('/{id}', [LoginLogController::class, 'show']); // Show single log
    });

    // Admin dashboard (Permission checked in controller)
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']); // Dashboard overview
        Route::get('/dashboard/revenue-trend', [AdminDashboardController::class, 'revenueTrend']); // Revenue trend
        Route::get('/dashboard/user-growth', [AdminDashboardController::class, 'userGrowth']); // User growth
    });

    // System settings (Permission checked in controller)
    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingsController::class, 'index']); // Get all settings
        Route::put('/', [SettingsController::class, 'update']); // Update settings
        Route::get('/{key}', [SettingsController::class, 'show']); // Get specific setting
        Route::post('/reset', [SettingsController::class, 'reset']); // Reset to defaults
    });

    // Audit logs (Permission checked in controller)
    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index']); // List audit logs
        Route::get('/statistics', [AuditLogController::class, 'statistics']); // Get statistics
        Route::get('/export', [AuditLogController::class, 'export']); // Export to CSV
        Route::get('/{id}', [AuditLogController::class, 'show']); // Show single log
    });

    // Reports (Permission checked in controller)
    Route::prefix('reports')->group(function () {
        Route::post('/', [ReportController::class, 'generate']); // Generate report
    });

    // Analytics (Permission checked in controller)
    Route::prefix('analytics')->group(function () {
        Route::get('/dashboard', [AnalyticsController::class, 'dashboard']); // Dashboard overview
        Route::get('/transactions', [AnalyticsController::class, 'transactionAnalytics']); // Transaction analytics
        Route::get('/users', [AnalyticsController::class, 'userAnalytics']); // User analytics
        Route::get('/financial', [AnalyticsController::class, 'financialAnalytics']); // Financial analytics
        Route::get('/security', [AnalyticsController::class, 'securityAnalytics']); // Security analytics
    });
});
