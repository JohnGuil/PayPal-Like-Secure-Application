<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add guard_name to permissions table (required by Spatie)
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('guard_name')->default('web')->after('slug');
            $table->dropUnique(['slug']); // Remove old unique constraint
            $table->unique(['name', 'guard_name']); // Add Spatie unique constraint
        });

        // Add guard_name to roles table (required by Spatie)
        Schema::table('roles', function (Blueprint $table) {
            $table->string('guard_name')->default('web')->after('slug');
            $table->dropUnique(['slug']); // Remove old unique constraint
            $table->unique(['name', 'guard_name']); // Add Spatie unique constraint
        });

        // Rename role_user to model_has_roles (Spatie's naming convention)
        // But we need to keep the structure
        Schema::rename('role_user', 'model_has_roles_temp');
        
        // Create model_has_roles with Spatie structure
        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            
            $table->index(['model_id', 'model_type'], 'model_has_roles_model_id_model_type_index');
            
            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                ->onDelete('cascade');
            
            $table->primary(['role_id', 'model_id', 'model_type'], 'model_has_roles_role_model_type_primary');
        });

        // Migrate data from old role_user to new model_has_roles
        DB::statement("
            INSERT INTO model_has_roles (role_id, model_type, model_id)
            SELECT role_id, 'App\\Models\\User', user_id
            FROM model_has_roles_temp
        ");

        // Drop the temp table
        Schema::dropIfExists('model_has_roles_temp');

        // Rename permission_role to role_has_permissions (Spatie's naming)
        Schema::rename('permission_role', 'role_has_permissions');
        
        // Update role_has_permissions structure to match Spatie
        Schema::table('role_has_permissions', function (Blueprint $table) {
            // Add foreign key constraints if they don't exist
            if (!Schema::hasColumn('role_has_permissions', 'permission_id')) {
                // Already has the right columns, just ensure foreign keys
                $table->foreign('permission_id')
                    ->references('id')
                    ->on('permissions')
                    ->onDelete('cascade');
                
                $table->foreign('role_id')
                    ->references('id')
                    ->on('roles')
                    ->onDelete('cascade');
            }
        });

        // Create model_has_permissions table (direct user permissions)
        Schema::create('model_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');
            
            $table->index(['model_id', 'model_type'], 'model_has_permissions_model_id_model_type_index');
            
            $table->foreign('permission_id')
                ->references('id')
                ->on('permissions')
                ->onDelete('cascade');
            
            $table->primary(['permission_id', 'model_id', 'model_type'], 'model_has_permissions_permission_model_type_primary');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('model_has_permissions');
        
        Schema::rename('role_has_permissions', 'permission_role');
        
        Schema::create('role_user', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('assigned_by')->nullable();
            $table->timestamp('assigned_at')->useCurrent();
            
            $table->primary(['user_id', 'role_id']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
        });

        DB::statement("
            INSERT INTO role_user (user_id, role_id)
            SELECT model_id, role_id
            FROM model_has_roles
            WHERE model_type = 'App\\\\Models\\\\User'
        ");

        Schema::dropIfExists('model_has_roles');

        Schema::table('roles', function (Blueprint $table) {
            $table->dropUnique(['name', 'guard_name']);
            $table->dropColumn('guard_name');
            $table->unique('slug');
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->dropUnique(['name', 'guard_name']);
            $table->dropColumn('guard_name');
            $table->unique('slug');
        });
    }
};
