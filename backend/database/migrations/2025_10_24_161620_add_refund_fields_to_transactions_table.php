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
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('original_transaction_id')->nullable()->after('description')
                  ->constrained('transactions')->onDelete('set null');
            $table->text('reason')->nullable()->after('original_transaction_id');
            $table->boolean('is_refunded')->default(false)->after('reason');
            
            // Add index for refund queries
            $table->index('is_refunded');
            $table->index('original_transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['original_transaction_id']);
            $table->dropColumn(['original_transaction_id', 'reason', 'is_refunded']);
        });
    }
};
