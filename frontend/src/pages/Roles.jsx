import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Roles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    level: 50,
    is_active: true,
    permissions: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const canCreate = user?.permissions?.some(p => p.slug === 'create-roles');
  const canUpdate = user?.permissions?.some(p => p.slug === 'update-roles');
  const canDelete = user?.permissions?.some(p => p.slug === 'delete-roles');
  const canAssign = user?.permissions?.some(p => p.slug === 'assign-roles');

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.roles || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/permissions');
      setPermissions(response.data.permissions || []);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const openModal = (role = null) => {
    if (role) {
      // Edit mode - populate form with role data
      setSelectedRole(role);
      setFormData({
        name: role.name,
        slug: role.slug,
        description: role.description || '',
        level: role.level,
        is_active: role.is_active,
        permissions: role.permissions?.map(p => p.slug) || []
      });
    } else {
      // Create mode - reset form
      setSelectedRole(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        level: 50,
        is_active: true,
        permissions: []
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handlePermissionToggle = (permissionSlug) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionSlug)
        ? prev.permissions.filter(p => p !== permissionSlug)
        : [...prev.permissions, permissionSlug]
    }));
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: selectedRole ? prev.slug : generateSlug(name) // Auto-generate slug only for new roles
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      if (selectedRole) {
        // Update existing role
        await api.put(`/roles/${selectedRole.id}`, formData);
        setError(null);
      } else {
        // Create new role
        await api.post('/roles', formData);
        setError(null);
      }
      
      setShowModal(false);
      fetchRoles();
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || 'Failed to save role');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      await api.delete(`/roles/${roleId}`);
      fetchRoles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const groupPermissionsByResource = () => {
    const grouped = {};
    permissions.forEach(perm => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
            <p className="text-gray-600 mt-1">Manage system roles and permissions</p>
          </div>
          {canCreate && (
            <button
              onClick={() => openModal()}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Role
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl
                    ${role.level === 100 ? 'bg-purple-500' : 
                      role.level >= 80 ? 'bg-red-500' : 
                      role.level >= 50 ? 'bg-blue-500' : 'bg-green-500'}`}>
                    {role.level === 100 ? '👑' : role.level >= 80 ? '🛡️' : role.level >= 50 ? '📊' : '👤'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                    <p className="text-xs text-gray-500">Level {role.level}</p>
                  </div>
                </div>
                {role.is_active ? (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    Inactive
                  </span>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">{role.permissions_count}</span> permissions
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{role.users_count}</span> users
                </p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 font-semibold mb-2">PERMISSIONS</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.slice(0, 6).map((perm) => (
                    <span
                      key={perm.id}
                      className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700"
                    >
                      {perm.slug}
                    </span>
                  ))}
                  {role.permissions?.length > 6 && (
                    <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                      +{role.permissions.length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {(canUpdate || canDelete) && (
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  {canUpdate && (
                    <button
                      onClick={() => openModal(role)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && !['super-admin', 'admin', 'user'].includes(role.slug) && (
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create/Edit Role Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="card max-w-2xl w-full my-8">
              <h2 className="text-2xl font-bold mb-4">
                {selectedRole ? 'Edit Role' : 'Create New Role'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Role Name *</label>
                  <input
                    type="text"
                    className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g., Content Manager"
                    required
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name[0]}</p>
                  )}
                </div>

                <div>
                  <label className="label">Slug *</label>
                  <input
                    type="text"
                    className={`input-field ${formErrors.slug ? 'border-red-500' : ''}`}
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    placeholder="e.g., content-manager"
                    required
                    disabled={selectedRole?.slug === 'super-admin'} // Can't change super-admin slug
                  />
                  {formErrors.slug && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.slug[0]}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">Lowercase, hyphens only (auto-generated from name)</p>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input-field"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of this role"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="label">Level (1-99) *</label>
                  <input
                    type="number"
                    className={`input-field ${formErrors.level ? 'border-red-500' : ''}`}
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                    min="1"
                    max="99"
                    required
                  />
                  {formErrors.level && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.level[0]}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">Higher level = more authority (100 reserved for Super Admin)</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">Active Role</label>
                </div>

                <div>
                  <label className="label">Permissions</label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
                    <div className="mb-3 flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-700">
                        Selected: {formData.permissions.length} / {permissions.length}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, permissions: permissions.map(p => p.slug)})}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, permissions: []})}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    
                    {Object.entries(groupPermissionsByResource()).map(([resource, perms]) => (
                      <div key={resource} className="mb-4 last:mb-0">
                        <h4 className="font-semibold text-gray-900 capitalize mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {resource}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                          {perms.map((perm) => (
                            <label key={perm.id} className="flex items-start gap-2 text-sm hover:bg-white p-2 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                checked={formData.permissions.includes(perm.slug)}
                                onChange={() => handlePermissionToggle(perm.slug)}
                              />
                              <div className="flex-1">
                                <span className="text-gray-900 font-medium">{perm.name}</span>
                                {perm.description && (
                                  <p className="text-xs text-gray-500">{perm.description}</p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {formErrors.permissions && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.permissions[0]}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : (selectedRole ? 'Update Role' : 'Create Role')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;
