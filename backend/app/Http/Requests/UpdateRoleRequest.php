<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('update-roles');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $roleId = $this->route('role');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:255',
                Rule::unique('roles')->ignore($roleId),
                'regex:/^[a-zA-Z\s]+$/'
            ],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:255',
                Rule::unique('roles')->ignore($roleId),
                'regex:/^[a-z0-9-]+$/',
                'alpha_dash'
            ],
            'description' => [
                'sometimes',
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
