<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('create-transactions');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'recipient_email' => [
                'required',
                'email',
                'exists:users,email',
                'different:' . $this->user()->email // Cannot send to self
            ],
            'amount' => [
                'required',
                'numeric',
                'min:0.01',
                'max:999999.99',
                'regex:/^\d+(\.\d{1,2})?$/' // Max 2 decimal places
            ],
            'type' => [
                'required',
                'string',
                'in:payment,transfer'
            ],
            'currency' => [
                'nullable',
                'string',
                'size:3',
                'in:USD,EUR,GBP,PHP' // Add more as needed
            ],
            'description' => [
                'nullable',
                'string',
                'max:500',
                'min:3'
            ]
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'recipient_email.required' => 'Recipient email is required',
            'recipient_email.email' => 'Please provide a valid email address',
            'recipient_email.exists' => 'Recipient not found in our system',
            'recipient_email.different' => 'You cannot send money to yourself',
            'amount.required' => 'Transaction amount is required',
            'amount.numeric' => 'Amount must be a valid number',
            'amount.min' => 'Minimum transaction amount is $0.01',
            'amount.max' => 'Maximum transaction amount is $999,999.99',
            'amount.regex' => 'Amount can have maximum 2 decimal places',
            'type.required' => 'Transaction type is required',
            'type.in' => 'Transaction type must be payment or transfer',
            'currency.size' => 'Currency code must be 3 characters',
            'currency.in' => 'Unsupported currency',
            'description.max' => 'Description cannot exceed 500 characters',
            'description.min' => 'Description must be at least 3 characters'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'recipient_email' => 'recipient email address',
            'amount' => 'transaction amount',
            'type' => 'transaction type',
            'currency' => 'currency code',
            'description' => 'transaction description'
        ];
    }
}
