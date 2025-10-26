import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();
  const location = useLocation();

  // Debug: Log user permissions when they change
  useEffect(() => {
    if (user?.permissions) {
      console.log('📋 User Permissions:', user.permissions.map(p => p.slug));
    }
  }, [user?.permissions]);

  // Helper function to check if user has a specific permission
  const hasPermission = (permission) => {
    return user?.permissions?.some(p => p.slug === permission);
  };

  // Helper function to check if user has a specific role
  const hasRole = (roleSlug) => {
    return user?.roles?.some(r => r.slug === roleSlug);
  };

  // Get primary role for display
  const getPrimaryRole = () => {
    if (!user?.roles || user.roles.length === 0) return null;
    return user.roles.reduce((highest, current) => 
      (current.level > highest.level) ? current : highest
    );
  };

  const primaryRole = getPrimaryRole();

  // Navigation items configuration with permission checks
  const navigationItems = [
    {
      section: 'Main',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
          show: true, // Always show dashboard
        },
        {
          name: 'Transactions',
          path: '/transactions',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
          show: hasPermission('view-transactions') || hasPermission('view-all-transactions'),
          badge: hasPermission('view-all-transactions') ? 'All' : 'Own',
        },
        {
          name: 'Login Logs',
          path: '/login-logs',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          show: hasPermission('view-login-logs') || hasPermission('view-all-login-logs'),
          badge: hasPermission('view-all-login-logs') ? 'All' : 'Own',
        },
      ],
    },
    {
      section: 'Management',
      items: [
        {
          name: 'Users',
          path: '/users',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
          show: hasPermission('view-users'),
          badge: hasPermission('create-users') && hasPermission('delete-users') ? 'Full' : 'View',
        },
        {
          name: 'Roles & Permissions',
          path: '/roles',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          show: hasPermission('view-roles'),
          badge: hasPermission('create-roles') && hasPermission('delete-roles') ? 'Full' : 'View',
        },
      ],
    },
    {
      section: 'Administration',
      // Show section if user has any admin-related permissions
      show: hasPermission('view-admin-dashboard') || hasPermission('view-system-settings') || hasPermission('view-audit-logs') || hasPermission('generate-reports'),
      items: [
        {
          name: 'Admin Dashboard',
          path: '/admin',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          show: hasPermission('view-admin-dashboard'),
        },
        {
          name: 'System Settings',
          path: '/settings',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          show: hasPermission('view-system-settings'),
          badge: 'Super Admin',
        },
        {
          name: 'Audit Logs',
          path: '/audit-logs',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
          show: hasPermission('view-audit-logs'),
          badge: 'Super Admin',
        },
        {
          name: 'Reports',
          path: '/reports',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          show: hasPermission('generate-reports'),
          badge: 'Super Admin',
        },
      ],
    },
  ];

  // Filter out sections/items that shouldn't be shown
  const visibleSections = navigationItems
    .filter(section => section.show !== false)
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.show !== false),
    }))
    .filter(section => section.items.length > 0);

  const getRoleBadgeColor = (roleSlug) => {
    switch(roleSlug) {
      case 'super-admin': return 'from-purple-500 to-purple-700';
      case 'admin': return 'from-red-500 to-red-700';
      case 'manager': return 'from-blue-500 to-blue-700';
      case 'user': return 'from-green-500 to-green-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64`}
      >
        {/* Logo Section */}
        <div className={`p-6 border-b border-gray-200 bg-gradient-to-r ${primaryRole ? getRoleBadgeColor(primaryRole.slug) : 'from-blue-500 to-purple-600'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">SecurePay</h2>
              <p className="text-blue-100 text-xs">Payment System</p>
            </div>
          </div>
        </div>

        {/* Role Badge */}
        {primaryRole && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Your Role</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{primaryRole.name}</p>
              </div>
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRoleBadgeColor(primaryRole.slug)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                {primaryRole.level}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {user?.permissions?.length || 0} permissions
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {visibleSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="mb-6">
              {/* Section Header */}
              <div className="px-6 mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.section}
                </h3>
              </div>

              {/* Section Items */}
              <div className="space-y-1 px-3">
                {section.items.map((item, itemIdx) => (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-sm">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        location.pathname === item.path
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Help Section */}
          <div className="px-6 mt-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Need Help?</h4>
                  <p className="text-xs text-gray-600 mt-1">Check our documentation or contact support</p>
                  <button className="text-xs text-blue-600 font-medium mt-2 hover:text-blue-700">
                    Learn More →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* User Info at Bottom */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
