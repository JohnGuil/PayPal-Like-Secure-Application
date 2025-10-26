<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('type')->default('string')->after('value');
            $table->text('description')->nullable()->after('type');
            $table->foreignId('updated_by')->nullable()->after('description')->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropForeign(['updated_by']);
            $table->dropColumn(['type', 'description', 'updated_by', 'created_at', 'updated_at']);
        });
    }
};
