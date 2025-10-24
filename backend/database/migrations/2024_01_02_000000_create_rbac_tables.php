<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Implements RBAC (Role-Based Access Control) following NIST RBAC standard
     */
    public function up(): void
    {
        // Roles table
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'admin', 'user', 'manager'
            $table->string('slug')->unique(); // URL-friendly name
            $table->string('description')->nullable();
            $table->integer('level')->default(1); // Hierarchy level (higher = more privileges)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Permissions table
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'create-user', 'delete-user'
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->string('resource')->nullable(); // e.g., 'users', 'transactions'
            $table->string('action')->nullable(); // e.g., 'create', 'read', 'update', 'delete'
            $table->timestamps();
        });

        // Role-Permission pivot table (Many-to-Many)
        Schema::create('permission_role', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->foreignId('permission_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            // Ensure unique role-permission combinations
            $table->unique(['role_id', 'permission_id']);
        });

        // User-Role pivot table (Many-to-Many)
        Schema::create('role_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('role_id')->constrained()->onDelete('cascade');
            $table->timestamp('assigned_at')->useCurrent();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Ensure unique user-role combinations
            $table->unique(['user_id', 'role_id']);
        });

        // Add role_id column to users table (optional: for primary role)
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('primary_role_id')->nullable()->after('last_login_ip')
                ->constrained('roles')->onDelete('set null');
        });

        // Audit log for role/permission changes
        Schema::create('role_permission_audit', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action'); // 'assigned', 'revoked', 'created', 'deleted'
            $table->string('entity_type'); // 'role', 'permission'
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_permission_audit');
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['primary_role_id']);
            $table->dropColumn('primary_role_id');
        });
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
