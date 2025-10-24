import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reportType, setReportType] = useState('user-activity');
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    user_id: '',
    role_slug: '',
    transaction_type: '',
    status: ''
  });
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    {
      id: 'user-activity',
      name: 'User Activity Report',
      description: 'Summary of user logins, actions, and activity',
      icon: 'user'
    },
    {
      id: 'transaction-summary',
      name: 'Transaction Summary',
      description: 'Overview of all transactions and their status',
      icon: 'chart'
    },
    {
      id: 'revenue-report',
      name: 'Revenue Report',
      description: 'Financial summary and revenue analysis',
      icon: 'currency'
    },
    {
      id: 'security-events',
      name: 'Security Events',
      description: 'Failed logins, suspicious activity, and security alerts',
      icon: 'shield'
    }
  ];

  const handleGenerateReport = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // TODO: Replace with actual API endpoint when backend is ready
      // const response = await api.post('/reports', {
      //   report_type: reportType,
      //   ...dateRange,
      //   ...filters
      // });
      // setReportData(response.data);

      // Mock data for demonstration
      const mockData = {
        'user-activity': {
          total_users: 156,
          active_users: 89,
          new_registrations: 12,
          total_logins: 342,
          average_session_duration: '24 minutes',
          most_active_users: [
            { name: 'Alice Johnson', logins: 45, last_seen: '2025-10-24T10:30:00Z' },
            { name: 'Bob Smith', logins: 38, last_seen: '2025-10-24T09:15:00Z' },
            { name: 'Charlie Brown', logins: 32, last_seen: '2025-10-24T08:20:00Z' }
          ]
        },
        'transaction-summary': {
          total_transactions: 1247,
          completed: 1178,
          pending: 23,
          failed: 38,
          cancelled: 8,
          total_amount: 125847.50,
          average_transaction: 100.92,
          largest_transaction: 5000.00,
          transaction_types: {
            payment: 856,
            refund: 124,
            transfer: 267
          }
        },
        'revenue-report': {
          total_revenue: 125847.50,
          revenue_by_day: [
            { date: '2025-10-18', amount: 4523.75 },
            { date: '2025-10-19', amount: 5234.20 },
            { date: '2025-10-20', amount: 3891.50 },
            { date: '2025-10-21', amount: 6124.80 },
            { date: '2025-10-22', amount: 4987.25 },
            { date: '2025-10-23', amount: 5456.30 },
            { date: '2025-10-24', amount: 4523.75 }
          ],
          top_revenue_users: [
            { name: 'Alice Johnson', total: 12450.00, transactions: 45 },
            { name: 'Bob Smith', total: 9823.50, transactions: 38 },
            { name: 'Charlie Brown', total: 7654.25, transactions: 32 }
          ]
        },
        'security-events': {
          total_events: 89,
          failed_logins: 67,
          account_lockouts: 12,
          suspicious_activity: 10,
          events_by_type: [
            { type: 'Failed Login', count: 67, severity: 'medium' },
            { type: 'Account Lockout', count: 12, severity: 'high' },
            { type: 'Multiple Failed Attempts', count: 8, severity: 'high' },
            { type: 'Unusual Login Location', count: 2, severity: 'critical' }
          ]
        }
      };

      setReportData(mockData[reportType]);
      setMessage({ type: 'success', text: 'Report generated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to generate report' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    if (!reportData) return;

    const selectedReport = reportTypes.find(r => r.id === reportType);
    const filename = `${reportType}-${dateRange.start_date}-to-${dateRange.end_date}.${format}`;

    if (format === 'csv') {
      // Simple CSV export
      const csvContent = `Report: ${selectedReport.name}\nGenerated: ${new Date().toLocaleString()}\n\n${JSON.stringify(reportData, null, 2)}`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      setMessage({ type: 'error', text: 'PDF export coming soon!' });
    }
  };

  const getReportIcon = (iconType) => {
    const icons = {
      user: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      chart: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      currency: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      shield: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    };
    return icons[iconType];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and export comprehensive reports</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                reportType === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                reportType === type.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {getReportIcon(type.icon)}
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{type.name}</h3>
              <p className="text-xs text-gray-500">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Parameters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Additional Filters based on report type */}
          {reportType === 'user-activity' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={filters.role_slug}
                onChange={(e) => setFilters({ ...filters, role_slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roles</option>
                <option value="super-admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>
            </div>
          )}

          {reportType === 'transaction-summary' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={filters.transaction_type}
                  onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="payment">Payment</option>
                  <option value="refund">Refund</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Report Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                Export PDF
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* User Activity Report */}
            {reportType === 'user-activity' && reportData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.total_users}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.active_users}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">New Registrations</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.new_registrations}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Most Active Users</h3>
                  <div className="space-y-2">
                    {reportData.most_active_users.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{user.name}</span>
                        <span className="text-sm text-gray-600">{user.logins} logins</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Summary Report */}
            {reportType === 'transaction-summary' && reportData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.total_transactions}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.completed}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.pending}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.failed}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Financial Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="font-bold text-gray-900">${reportData.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Average Transaction</span>
                        <span className="font-bold text-gray-900">${reportData.average_transaction}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Largest Transaction</span>
                        <span className="font-bold text-gray-900">${reportData.largest_transaction.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">By Type</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Payments</span>
                        <span className="font-bold text-gray-900">{reportData.transaction_types.payment}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Refunds</span>
                        <span className="font-bold text-gray-900">{reportData.transaction_types.refund}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Transfers</span>
                        <span className="font-bold text-gray-900">{reportData.transaction_types.transfer}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Report */}
            {reportType === 'revenue-report' && reportData && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">${reportData.total_revenue.toLocaleString()}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Revenue by Day (Last 7 Days)</h3>
                  <div className="space-y-2">
                    {reportData.revenue_by_day.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                        <span className="font-bold text-gray-900">${day.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Top Revenue Generators</h3>
                  <div className="space-y-2">
                    {reportData.top_revenue_users.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({user.transactions} transactions)</span>
                        </div>
                        <span className="font-bold text-gray-900">${user.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Events Report */}
            {reportType === 'security-events' && reportData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.total_events}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Failed Logins</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.failed_logins}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Lockouts</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.account_lockouts}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Suspicious Activity</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.suspicious_activity}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Events by Type</h3>
                  <div className="space-y-2">
                    {reportData.events_by_type.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            event.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {event.severity}
                          </span>
                          <span className="font-medium text-gray-900">{event.type}</span>
                        </div>
                        <span className="font-bold text-gray-900">{event.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
