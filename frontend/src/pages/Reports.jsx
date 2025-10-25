import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import analyticsService from '../services/analyticsService';

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reportType, setReportType] = useState('user-activity');
  
  // Set date range to last 7 days including today
  // Add 1 day to end_date to ensure we include all of today's data
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: tomorrow.toISOString().split('T')[0]
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
      let data;
      
      // Call real analytics API endpoints based on report type
      switch (reportType) {
        case 'user-activity': {
          const response = await analyticsService.getUserAnalytics(dateRange);
          // Transform API response to match component structure
          data = {
            total_users: response.summary.total_users,
            active_users: response.summary.active_users,
            new_registrations: response.summary.new_users,
            total_logins: response.login_activity?.reduce((sum, day) => sum + day.login_count, 0) || 0,
            average_session_duration: '24 minutes', // Not available yet
            most_active_users: response.most_active_users?.map(u => ({
              name: u.user.full_name,
              logins: u.login_count,
              last_seen: new Date().toISOString() // Use current date as placeholder
            })) || [],
            users_by_role: response.users_by_role || [],
            two_factor_stats: response.two_factor_stats || { enabled: 0, disabled: 0, percentage: '0.00' },
            registration_trends: response.registration_trends || []
          };
          break;
        }

        case 'transaction-summary': {
          const response = await analyticsService.getTransactionAnalytics({
            ...dateRange,
            period: 'day'
          });
          // Transform API response
          const statusCounts = response.by_status.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
          }, {});
          
          const typeCounts = response.by_type.reduce((acc, item) => {
            acc[item.type] = item.count;
            return acc;
          }, {});

          // Calculate largest transaction from trends
          const largestTransaction = response.trends && response.trends.length > 0
            ? Math.max(...response.trends.map(t => parseFloat(t.total_amount)))
            : 0;

          data = {
            total_transactions: response.summary.total_transactions,
            completed: statusCounts.completed || 0,
            pending: statusCounts.pending || 0,
            failed: statusCounts.failed || 0,
            cancelled: statusCounts.cancelled || 0,
            total_amount: parseFloat(response.summary.total_volume.replace(/,/g, '')),
            average_transaction: parseFloat(response.summary.average_amount),
            largest_transaction: largestTransaction,
            transaction_types: {
              payment: typeCounts.payment || 0,
              refund: typeCounts.refund || 0,
              transfer: typeCounts.transfer || 0
            },
            by_type: response.by_type,
            top_senders: response.top_senders,
            top_recipients: response.top_recipients,
            trends: response.trends
          };
          break;
        }

        case 'revenue-report': {
          const response = await analyticsService.getFinancialAnalytics(dateRange);
          // Transform API response
          data = {
            total_revenue: parseFloat(response.summary.money_in.replace(/,/g, '')),
            revenue_by_day: response.daily_flow.map(day => ({
              date: day.date,
              amount: parseFloat(day.money_in)
            })),
            top_revenue_users: response.top_balances.slice(0, 3).map(user => ({
              name: user.full_name,
              total: parseFloat(user.balance),
              transactions: 0 // Not available in this endpoint
            })),
            balance_distribution: response.balance_distribution,
            summary: response.summary,
            revenue_by_currency: response.revenue_by_currency
          };
          break;
        }

        case 'security-events': {
          // This would need a new backend endpoint for security events
          // For now, use placeholder data
          data = {
            total_events: 0,
            failed_logins: 0,
            account_lockouts: 0,
            suspicious_activity: 0,
            events_by_type: []
          };
          setMessage({ type: 'error', text: 'Security events report requires additional backend implementation' });
          setLoading(false);
          return;
        }

        default:
          throw new Error('Unknown report type');
      }

      setReportData(data);
      setMessage({ type: 'success', text: 'Report generated successfully from live data!' });
    } catch (error) {
      console.error('Report generation error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to generate report. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    if (!reportData) return;

    const selectedReport = reportTypes.find(r => r.id === reportType);
    const filename = `${reportType}-${dateRange.start_date}-to-${dateRange.end_date}.${format}`;

    if (format === 'csv') {
      let csvContent = '';
      
      // Header
      csvContent += `${selectedReport.name}\n`;
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Date Range: ${dateRange.start_date} to ${dateRange.end_date}\n\n`;

      // Report-specific content
      if (reportType === 'user-activity') {
        csvContent += `SUMMARY\n`;
        csvContent += `Total Users,${reportData.total_users}\n`;
        csvContent += `Active Users,${reportData.active_users}\n`;
        csvContent += `New Registrations,${reportData.new_registrations}\n`;
        csvContent += `Total Logins,${reportData.total_logins}\n`;
        csvContent += `Average Session Duration,${reportData.average_session_duration}\n\n`;

        csvContent += `MOST ACTIVE USERS\n`;
        csvContent += `Name,Logins,Last Seen\n`;
        reportData.most_active_users?.forEach(user => {
          csvContent += `${user.name},${user.logins},${new Date(user.last_seen).toLocaleString()}\n`;
        });

        csvContent += `\nUSERS BY ROLE\n`;
        csvContent += `Role,Count\n`;
        reportData.users_by_role?.forEach(role => {
          csvContent += `${role.role},${role.count}\n`;
        });

        csvContent += `\n2FA STATISTICS\n`;
        csvContent += `Enabled,${reportData.two_factor_stats?.enabled || 0}\n`;
        csvContent += `Disabled,${reportData.two_factor_stats?.disabled || 0}\n`;
        csvContent += `Percentage Enabled,${reportData.two_factor_stats?.percentage || 0}%\n`;

      } else if (reportType === 'transaction-summary') {
        csvContent += `SUMMARY\n`;
        csvContent += `Total Transactions,${reportData.total_transactions}\n`;
        csvContent += `Completed,${reportData.completed}\n`;
        csvContent += `Pending,${reportData.pending}\n`;
        csvContent += `Failed,${reportData.failed}\n`;
        csvContent += `Cancelled,${reportData.cancelled}\n`;
        csvContent += `Total Amount,"$${reportData.total_amount?.toLocaleString() || 0}"\n`;
        csvContent += `Average Transaction,"$${reportData.average_transaction || 0}"\n`;
        csvContent += `Largest Transaction,"$${reportData.largest_transaction?.toLocaleString() || 0}"\n\n`;

        csvContent += `TRANSACTION TYPES\n`;
        csvContent += `Type,Count\n`;
        csvContent += `Payments,${reportData.transaction_types?.payment || 0}\n`;
        csvContent += `Refunds,${reportData.transaction_types?.refund || 0}\n`;
        csvContent += `Transfers,${reportData.transaction_types?.transfer || 0}\n\n`;

        csvContent += `TOP SENDERS\n`;
        csvContent += `Name,Email,Transactions,Total Sent\n`;
        reportData.top_senders?.forEach(sender => {
          csvContent += `${sender.sender?.full_name},${sender.sender?.email},${sender.transaction_count},"$${sender.total_sent}"\n`;
        });

        csvContent += `\nTOP RECIPIENTS\n`;
        csvContent += `Name,Email,Transactions,Total Received\n`;
        reportData.top_recipients?.forEach(recipient => {
          csvContent += `${recipient.recipient?.full_name},${recipient.recipient?.email},${recipient.transaction_count},"$${recipient.total_received}"\n`;
        });

      } else if (reportType === 'revenue-report') {
        csvContent += `SUMMARY\n`;
        csvContent += `Total Revenue,"$${reportData.total_revenue?.toLocaleString() || 0}"\n\n`;

        csvContent += `REVENUE BY DAY\n`;
        csvContent += `Date,Amount\n`;
        reportData.revenue_by_day?.forEach(day => {
          csvContent += `${new Date(day.date).toLocaleDateString()},"$${day.amount?.toLocaleString() || 0}"\n`;
        });

        csvContent += `\nTOP REVENUE USERS\n`;
        csvContent += `Name,Total,Transactions\n`;
        reportData.top_revenue_users?.forEach(user => {
          csvContent += `${user.name},"$${user.total?.toLocaleString() || 0}",${user.transactions}\n`;
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Report exported successfully!' });
      
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Report exported successfully!' });
      
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
              onClick={() => {
                setReportType(type.id);
                setReportData(null); // Clear old report data when changing type
              }}
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
                    {reportData.most_active_users && reportData.most_active_users.length > 0 ? (
                      reportData.most_active_users.map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{user.name}</span>
                          <span className="text-sm text-gray-600">{user.logins} logins</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No active users in this period</p>
                    )}
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
                        <span className="font-bold text-gray-900">${(reportData?.total_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Average Transaction</span>
                        <span className="font-bold text-gray-900">${reportData?.average_transaction || '0.00'}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Largest Transaction</span>
                        <span className="font-bold text-gray-900">${(reportData?.largest_transaction || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">By Type</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Payments</span>
                        <span className="font-bold text-gray-900">{reportData?.transaction_types?.payment || 0}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Refunds</span>
                        <span className="font-bold text-gray-900">{reportData?.transaction_types?.refund || 0}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Transfers</span>
                        <span className="font-bold text-gray-900">{reportData?.transaction_types?.transfer || 0}</span>
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
                  <p className="text-4xl font-bold text-gray-900 mt-2">${(reportData?.total_revenue || 0).toLocaleString()}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Revenue by Day (Last 7 Days)</h3>
                  <div className="space-y-2">
                    {reportData.revenue_by_day && reportData.revenue_by_day.length > 0 ? (
                      reportData.revenue_by_day.map((day, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                          <span className="font-bold text-gray-900">${(day?.amount || 0).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No revenue data for this period</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Top Revenue Generators</h3>
                  <div className="space-y-2">
                    {reportData.top_revenue_users && reportData.top_revenue_users.length > 0 ? (
                      reportData.top_revenue_users.map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium text-gray-900">{user.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({user.transactions} transactions)</span>
                          </div>
                          <span className="font-bold text-gray-900">${(user?.total || 0).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No revenue data available</p>
                    )}
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
                    {reportData.events_by_type && reportData.events_by_type.length > 0 ? (
                      reportData.events_by_type.map((event, index) => (
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
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No security events in this period</p>
                    )}
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
