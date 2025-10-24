<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignPermissionsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('assign-roles');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'permissions' => [
                'required',
                'array',
                'min:1'
            ],
            'permissions.*' => [
                'required',
                'integer',
                'exists:permissions,id'
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
            'permissions.required' => 'Permissions are required',
            'permissions.array' => 'Permissions must be an array',
            'permissions.min' => 'At least one permission must be selected',
            'permissions.*.required' => 'Permission ID is required',
            'permissions.*.integer' => 'Permission ID must be a number',
            'permissions.*.exists' => 'One or more permissions do not exist'
        ];
    }
}
