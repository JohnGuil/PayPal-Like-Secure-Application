<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('create-roles');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                'unique:roles,name',
                'regex:/^[a-zA-Z\s]+$/' // Only letters and spaces
            ],
            'slug' => [
                'required',
                'string',
                'min:2',
                'max:255',
                'unique:roles,slug',
                'regex:/^[a-z0-9-]+$/', // Lowercase letters, numbers, and hyphens
                'alpha_dash'
            ],
            'description' => [
                'nullable',
                'string',
                'max:500'
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
            'name.required' => 'Role name is required',
            'name.unique' => 'This role name already exists',
            'name.regex' => 'Role name can only contain letters and spaces',
            'slug.required' => 'Role slug is required',
            'slug.unique' => 'This role slug already exists',
            'slug.regex' => 'Role slug can only contain lowercase letters, numbers, and hyphens',
            'description.max' => 'Description cannot exceed 500 characters'
        ];
    }
}
