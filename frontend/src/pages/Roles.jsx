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
    const role = roles.find(r => r.id === roleId);
    const confirmMessage = `Are you sure you want to delete the role "${role?.name}"?\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setError(null);
      await api.delete(`/roles/${roleId}`);
      await fetchRoles();
      
      // Show success message briefly
      const successMsg = `Role "${role?.name}" deleted successfully!`;
      setError(null);
      alert(successMsg);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete role';
      setError(errorMsg);
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            {/* Dialog container: column layout with header, scrollable content, footer */}
            <div className="card max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-white z-20">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedRole ? 'Edit Role' : 'Create New Role'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedRole ? 'Update role details and permissions' : 'Create a new role with specific permissions'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        disabled={selectedRole?.slug === 'super-admin'}
                      />
                      {formErrors.slug && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.slug[0]}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">Lowercase, hyphens only</p>
                    </div>
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <textarea
                      className="input-field"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Brief description of this role's purpose and responsibilities"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Authority Level (1-99) *</label>
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
                      <p className="text-gray-500 text-xs mt-1">Higher = more authority (100 is Super Admin)</p>
                    </div>

                    <div className="flex items-center">
                      <div className="flex items-center gap-3 h-full">
                        <input
                          type="checkbox"
                          id="is_active"
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                          Active Role
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions Section */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Permissions</h3>
                    <p className="text-sm text-gray-600">Select the permissions this role should have</p>
                  </div>
                  
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">
                        {formData.permissions.length} of {permissions.length} selected
                      </span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, permissions: permissions.map(p => p.slug)})}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, permissions: []})}
                          className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 max-h-80 overflow-y-auto bg-white">
                      {Object.entries(groupPermissionsByResource()).map(([resource, perms]) => (
                        <div key={resource} className="mb-6 last:mb-0">
                          <h4 className="font-semibold text-gray-900 capitalize mb-3 flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            {resource.replace('-', ' ')}
                            <span className="text-xs text-gray-500 font-normal">({perms.length})</span>
                          </h4>
                          <div className="space-y-2 pl-4">
                            {perms.map((perm) => (
                              <label 
                                key={perm.id} 
                                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                              >
                                <input
                                  type="checkbox"
                                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  checked={formData.permissions.includes(perm.slug)}
                                  onChange={() => handlePermissionToggle(perm.slug)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {perm.name}
                                  </div>
                                  {perm.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{perm.description}</p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {formErrors.permissions && (
                    <p className="text-red-500 text-sm mt-2">{formErrors.permissions[0]}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      selectedRole ? 'Update Role' : 'Create Role'
                    )}
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
