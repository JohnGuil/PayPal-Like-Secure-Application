<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RolePermissionAudit extends Model
{
    use HasFactory;

    protected $table = 'role_permission_audit';

    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'old_value',
        'new_value',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who performed the action
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the role if entity_type is 'role'
     */
    public function role()
    {
        return $this->entity_type === 'role' 
            ? Role::find($this->entity_id) 
            : null;
    }

    /**
     * Get the permission if entity_type is 'permission'
     */
    public function permission()
    {
        return $this->entity_type === 'permission' 
            ? Permission::find($this->entity_id) 
            : null;
    }
}
