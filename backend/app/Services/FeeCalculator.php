<?php

namespace App\Services;

class FeeCalculator
{
    /**
     * PayPal-style fee structure
     */
    const PAYMENT_PERCENTAGE = 2.9; // 2.9% for goods/services
    const PAYMENT_FIXED_FEE = 0.30; // $0.30 fixed fee
    const TRANSFER_FEE_PERCENTAGE = 0; // Free for friends & family transfers

    /**
     * Calculate transaction fee based on PayPal model
     * 
     * @param float $amount Transaction amount
     * @param string $type Transaction type (payment, transfer, refund)
     * @return array ['fee' => float, 'net_amount' => float]
     */
    public static function calculateFee(float $amount, string $type): array
    {
        $fee = 0;

        switch ($type) {
            case 'payment':
                // PayPal standard rate: 2.9% + $0.30
                $fee = round(($amount * self::PAYMENT_PERCENTAGE / 100) + self::PAYMENT_FIXED_FEE, 2);
                break;

            case 'transfer':
                // Friends & Family: FREE
                $fee = 0;
                break;

            case 'refund':
                // Refunds: Fee is returned (so negative fee)
                // We'll handle this in the transaction logic
                $fee = 0;
                break;

            default:
                $fee = 0;
        }

        // Net amount is what recipient receives
        $netAmount = round($amount - $fee, 2);

        return [
            'fee' => $fee,
            'net_amount' => $netAmount,
        ];
    }

    /**
     * Calculate platform revenue from fees
     * 
     * @param string $type Transaction type
     * @param float $fee Transaction fee
     * @return float Platform revenue (what we earn)
     */
    public static function calculatePlatformRevenue(string $type, float $fee): float
    {
        switch ($type) {
            case 'payment':
                // We earn the full fee on payments
                return $fee;

            case 'transfer':
                // No revenue from free transfers, but we earn from float interest
                return 0;

            case 'refund':
                // Refunds reduce revenue (return the fee)
                return -$fee;

            default:
                return 0;
        }
    }

    /**
     * Get fee structure info for display
     * 
     * @param string $type Transaction type
     * @return array
     */
    public static function getFeeStructure(string $type): array
    {
        switch ($type) {
            case 'payment':
                return [
                    'type' => 'payment',
                    'description' => 'For goods and services',
                    'rate' => self::PAYMENT_PERCENTAGE . '% + $' . number_format(self::PAYMENT_FIXED_FEE, 2),
                    'percentage' => self::PAYMENT_PERCENTAGE,
                    'fixed_fee' => self::PAYMENT_FIXED_FEE,
                ];

            case 'transfer':
                return [
                    'type' => 'transfer',
                    'description' => 'Friends & Family transfer',
                    'rate' => 'FREE',
                    'percentage' => 0,
                    'fixed_fee' => 0,
                ];

            case 'refund':
                return [
                    'type' => 'refund',
                    'description' => 'Refund transaction',
                    'rate' => 'Fee returned to sender',
                    'percentage' => 0,
                    'fixed_fee' => 0,
                ];

            default:
                return [
                    'type' => $type,
                    'description' => 'Unknown transaction type',
                    'rate' => 'N/A',
                    'percentage' => 0,
                    'fixed_fee' => 0,
                ];
        }
    }
}
