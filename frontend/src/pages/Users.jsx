import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    password: '',
    role_id: ''
  });

  const canCreate = user?.permissions?.some(p => p.slug === 'create-users');
  const canUpdate = user?.permissions?.some(p => p.slug === 'update-users');
  const canDelete = user?.permissions?.some(p => p.slug === 'delete-users');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [currentPage, perPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users?page=${currentPage}&per_page=${perPage}`);
      
      // Handle paginated response from Laravel
      const data = response.data;
      setUsers(data.data || []);
      setCurrentPage(data.current_page || 1);
      setTotalPages(data.last_page || 1);
      setTotal(data.total || 0);
      setPerPage(data.per_page || 15);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.roles || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const getRoleBadgeColor = (roleSlug) => {
    const colors = {
      'super-admin': 'bg-purple-100 text-purple-800 border border-purple-200',
      'admin': 'bg-red-100 text-red-800 border border-red-200',
      'manager': 'bg-blue-100 text-blue-800 border border-blue-200',
      'user': 'bg-green-100 text-green-800 border border-green-200',
    };
    return colors[roleSlug] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormLoading(true);
    
    try {
      await api.post('/users', formData);
      setShowCreateModal(false);
      setFormData({ full_name: '', email: '', mobile_number: '', password: '', role_id: '' });
      setFormErrors({});
      fetchUsers();
    } catch (err) {
      // Handle Laravel validation errors
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setFormErrors({ general: err.response?.data?.message || 'Failed to create user' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || user.name,
      email: user.email,
      mobile_number: user.mobile_number || '',
      password: '', // Don't pre-fill password
      role_id: user.roles?.[0]?.id || user.primary_role?.id || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setFormLoading(true);
    
    try {
      const updateData = {
        full_name: formData.full_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        role_id: formData.role_id
      };
      
      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await api.put(`/users/${editingUser.id}`, updateData);
      setShowEditModal(false);
      setEditingUser(null);
      setFormData({ full_name: '', email: '', mobile_number: '', password: '', role_id: '' });
      setFormErrors({});
      fetchUsers();
    } catch (err) {
      // Handle Laravel validation errors
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setFormErrors({ general: err.response?.data?.message || 'Failed to update user' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and their roles</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create User
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  2FA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                {(canUpdate || canDelete) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{u.full_name}</div>
                        <div className="text-sm text-gray-500">ID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.mobile_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(u.primary_role?.slug)}`}>
                      {u.primary_role?.name || 'No Role'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.two_factor_enabled ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                  </td>
                  {(canUpdate || canDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <button 
                            onClick={() => handleEdit(u)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && u.id !== user?.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{users.length > 0 ? ((currentPage - 1) * perPage) + 1 : 0}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * perPage, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> users
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Create New User</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ full_name: '', email: '', mobile_number: '', password: '', role_id: '' });
                    setFormErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {formErrors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {formErrors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className={`input-field ${formErrors.full_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.full_name}
                    onChange={(e) => {
                      setFormData({ ...formData, full_name: e.target.value });
                      setFormErrors({ ...formErrors, full_name: null });
                    }}
                    placeholder="Enter full name"
                  />
                  {formErrors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.full_name[0]}</p>
                  )}
                </div>

                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    required
                    className={`input-field ${formErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setFormErrors({ ...formErrors, email: null });
                    }}
                    placeholder="user@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email[0]}</p>
                  )}
                </div>

                <div>
                  <label className="label">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    className={`input-field ${formErrors.mobile_number ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.mobile_number}
                    onChange={(e) => {
                      setFormData({ ...formData, mobile_number: e.target.value });
                      setFormErrors({ ...formErrors, mobile_number: null });
                    }}
                    placeholder="+1234567890"
                    pattern="^\+?[1-9]\d{1,14}$"
                  />
                  {formErrors.mobile_number && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.mobile_number[0]}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    International format (e.g., +1234567890). 10-15 digits required.
                  </p>
                </div>

                <div>
                  <label className="label">Password *</label>
                  <input
                    type="password"
                    required
                    className={`input-field ${formErrors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setFormErrors({ ...formErrors, password: null });
                    }}
                    placeholder="Min 8 chars, mixed case, numbers, symbols"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password[0]}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols
                  </p>
                </div>

                <div>
                  <label className="label">Role *</label>
                  <select
                    required
                    className={`input-field ${formErrors.role_id ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.role_id}
                    onChange={(e) => {
                      setFormData({ ...formData, role_id: e.target.value });
                      setFormErrors({ ...formErrors, role_id: null });
                    }}
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  {formErrors.role_id && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.role_id[0]}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create User'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ full_name: '', email: '', mobile_number: '', password: '', role_id: '' });
                      setFormErrors({});
                    }}
                    className="btn-secondary flex-1"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Edit User</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData({ full_name: '', email: '', mobile_number: '', password: '', role_id: '' });
                    setFormErrors({});
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {formErrors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {formErrors.general}
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className={`input-field ${formErrors.full_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.full_name}
                    onChange={(e) => {
                      setFormData({ ...formData, full_name: e.target.value });
                      setFormErrors({ ...formErrors, full_name: null });
                    }}
                    placeholder="Enter full name"
                  />
                  {formErrors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.full_name[0]}</p>
                  )}
                </div>

                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    required
                    className={`input-field ${formErrors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setFormErrors({ ...formErrors, email: null });
                    }}
                    placeholder="user@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email[0]}</p>
                  )}
                </div>

                <div>
                  <label className="label">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    className={`input-field ${formErrors.mobile_number ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.mobile_number}
                    onChange={(e) => {
                      setFormData({ ...formData, mobile_number: e.target.value });
                      setFormErrors({ ...formErrors, mobile_number: null });
                    }}
                    placeholder="+1234567890"
                    pattern="^\+?[1-9]\d{1,14}$"
                  />
                  {formErrors.mobile_number && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.mobile_number[0]}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    International format (e.g., +1234567890). 10-15 digits required.
                  </p>
                </div>

                <div>
                  <label className="label">Password (optional)</label>
                  <input
                    type="password"
                    className={`input-field ${formErrors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setFormErrors({ ...formErrors, password: null });
                    }}
                    placeholder="Leave blank to keep current password"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password[0]}</p>
                  )}
                  {formData.password && (
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Role *</label>
                  <select
                    required
                    className={`input-field ${formErrors.role_id ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={formData.role_id}
                    onChange={(e) => {
                      setFormData({ ...formData, role_id: e.target.value });
                      setFormErrors({ ...formErrors, role_id: null });
                    }}
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  {formErrors.role_id && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.role_id[0]}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Update User'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                      setFormData({ full_name: '', email: '', mobile_number: '', password: '', role_id: '' });
                      setFormErrors({});
                    }}
                    className="btn-secondary flex-1"
                    disabled={formLoading}
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

export default Users;
