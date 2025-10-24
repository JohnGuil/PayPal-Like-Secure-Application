<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('create-users');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                'regex:/^[a-zA-Z\s]+$/' // Only letters and spaces
            ],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email'
            ],
            'mobile_number' => [
                'required',
                'string',
                'regex:/^([0-9\s\-\+\(\)]*)$/',
                'min:10',
                'max:20',
                'unique:users,mobile_number'
            ],
            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
                'confirmed'
            ],
            'role_id' => [
                'required',
                'integer',
                'exists:roles,id'
            ],
            'balance' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999.99'
            ],
            'currency' => [
                'nullable',
                'string',
                'size:3',
                'in:USD,EUR,GBP,PHP'
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
            'full_name.required' => 'Full name is required',
            'full_name.regex' => 'Full name can only contain letters and spaces',
            'email.required' => 'Email address is required',
            'email.unique' => 'This email is already registered',
            'mobile_number.required' => 'Mobile number is required',
            'mobile_number.regex' => 'Invalid mobile number format',
            'mobile_number.unique' => 'This mobile number is already registered',
            'password.required' => 'Password is required',
            'password.confirmed' => 'Password confirmation does not match',
            'role_id.required' => 'Role is required',
            'role_id.exists' => 'Selected role does not exist',
            'balance.min' => 'Balance cannot be negative',
            'currency.in' => 'Unsupported currency'
        ];
    }
}
