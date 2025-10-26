import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import RevenueVolumeChart from '../components/charts/RevenueVolumeChart';
import TransactionTypePieChart from '../components/charts/TransactionTypePieChart';
import UserGrowthChart from '../components/charts/UserGrowthChart';
import HourlyActivityChart from '../components/charts/HourlyActivityChart';
import KPIWidget from '../components/charts/KPIWidget';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Chart data states
  const [revenueVolumeData, setRevenueVolumeData] = useState([]);
  const [transactionTypesData, setTransactionTypesData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [hourlyActivityData, setHourlyActivityData] = useState([]);
  const [kpiComparison, setKpiComparison] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('7'); // days

  useEffect(() => {
    fetchDashboardData();
    fetchChartData();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [chartPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching dashboard data...');
      
      // Fetch real data from analytics API
      const dashboardData = await analyticsService.getDashboard();
      
      console.log('✅ Dashboard response:', dashboardData);
      console.log('🔒 Security data:', dashboardData.system?.security);
      
      const statsData = {
        total_users: dashboardData.system?.total_users || 0,
        active_users: dashboardData.today?.active_users || 0,
        total_transactions: dashboardData.all_time?.transactions || 0,
        total_volume: dashboardData.all_time?.volume || 0,
        total_revenue: dashboardData.all_time?.revenue || 0,
        pending_transactions: dashboardData.system?.pending_transactions || 0,
        failed_transactions: dashboardData.system?.health?.failed_transactions || 0,
        new_users_today: 0, // Not yet tracked
        transactions_today: dashboardData.today?.transactions || 0,
        transactions_this_month: dashboardData.this_month?.transactions || 0,
        volume_today: dashboardData.today?.volume || 0,
        volume_this_month: dashboardData.this_month?.volume || 0,
        revenue_today: dashboardData.today?.revenue || 0,
        revenue_this_month: dashboardData.this_month?.revenue || 0,
        system_health: {
          database: dashboardData.system?.health?.database || 'unknown',
          api_response_time: dashboardData.system?.health?.db_response_time || 0,
          error_rate: dashboardData.system?.health?.error_rate || 0,
          uptime: 99.98 // This would require external monitoring
        },
        security: {
          failed_logins_24h: dashboardData.system?.security?.failed_logins_24h || 0,
          locked_accounts: dashboardData.system?.security?.locked_accounts || 0,
          suspicious_activity: dashboardData.system?.security?.suspicious_activity || 0,
          two_factor_percentage: dashboardData.system?.security?.two_factor_percentage || 0
        }
      };
      
      console.log('📊 Setting stats:', statsData);
      console.log('🔒 Security stats specifically:', statsData.security);
      setStats(statsData);

      // Transform recent transactions to activity feed
      const activities = (dashboardData.recent_transactions || []).map((transaction, index) => ({
        id: transaction.id,
        type: transaction.type === 'refund' ? 'transaction_refund' : 'transaction_completed',
        user: { 
          name: transaction.sender?.full_name || 'Unknown', 
          email: transaction.sender?.email || 'N/A' 
        },
        recipient: transaction.recipient?.full_name,
        amount: parseFloat(transaction.amount),
        timestamp: transaction.created_at,
        icon: transaction.type === 'refund' ? 'refund' : 'currency',
        color: transaction.type === 'refund' ? 'red' : 'green'
      }));

      console.log('📜 Recent activities:', activities);

      setRecentActivity(activities);
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      setChartLoading(true);
      
      // Fetch all chart data in parallel
      const [revenueVolume, transactionTypes, userGrowth, hourlyActivity, kpi] = await Promise.all([
        analyticsService.getRevenueVolumeChart(chartPeriod),
        analyticsService.getTransactionTypeBreakdown(30),
        analyticsService.getUserGrowthChart(30),
        analyticsService.getHourlyActivity(chartPeriod),
        analyticsService.getKPIComparison('week')
      ]);

      setRevenueVolumeData(revenueVolume.data || []);
      setTransactionTypesData(transactionTypes.data || []);
      setUserGrowthData(userGrowth.data || []);
      setHourlyActivityData(hourlyActivity.data || []);
      setKpiComparison(kpi.data || null);
      
      console.log('✅ Chart data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching chart data:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      'user-plus': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      'currency': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'refund': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
      'lock': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      'shield': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    };
    return icons[type];
  };

  const getActivityColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  const formatActivityText = (activity) => {
    switch (activity.type) {
      case 'user_registered':
        return `${activity.user.name} registered a new account`;
      case 'transaction_completed':
        return `${activity.user.name} sent $${activity.amount?.toFixed(2)} to ${activity.recipient || 'unknown'}`;
      case 'transaction_refund':
        return `${activity.user.name} refunded $${activity.amount?.toFixed(2)} to ${activity.recipient || 'unknown'}`;
      case 'login_failed':
        return `Failed login attempt for ${activity.user.name}`;
      case 'role_assigned':
        return `${activity.user.name} was assigned ${activity.role} role`;
      default:
        return 'Unknown activity';
    }
  };

  const getHealthStatusColor = (status) => {
    if (status === 'healthy') return 'bg-green-500';
    if (status === 'unhealthy') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getResponseTimeColor = (time) => {
    if (time < 100) return 'bg-green-500';
    if (time < 500) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getErrorRateColor = (rate) => {
    if (rate < 1) return 'bg-green-500';
    if (rate < 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-600 mt-2">System overview and analytics</p>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.total_users}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.total_transactions?.toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Volume</p>
              <p className="text-3xl font-bold text-gray-900">${(stats?.total_volume || 0).toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-10">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(stats?.system_health.database)}`}></div>
                <span className="text-sm font-medium text-gray-700">Database</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 capitalize">{stats?.system_health.database}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getResponseTimeColor(stats?.system_health.api_response_time)}`}></div>
                <span className="text-sm font-medium text-gray-700">DB Response</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.system_health.api_response_time?.toFixed(2)}ms</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getErrorRateColor(stats?.system_health.error_rate)}`}></div>
                <span className="text-sm font-medium text-gray-700">Error Rate</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.system_health.error_rate?.toFixed(2)}%</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Uptime</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.system_health.uptime}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link 
              to="/transactions" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.color)}`}>
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{formatActivityText(activity)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Security Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">🔒 Security Overview</h2>
              <Link to="/reports?type=security-events" className="text-sm text-blue-600 hover:text-blue-700">
                View Report →
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Failed Logins (Last 24h) */}
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Failed Login Attempts</p>
                    <p className="text-xs text-gray-500">Last 24 hours</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-yellow-800">
                  {stats?.security?.failed_logins_24h || 0}
                </span>
              </div>

              {/* Currently Locked Accounts */}
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Locked Accounts</p>
                    <p className="text-xs text-gray-500">Currently active</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-red-800">
                  {stats?.security?.locked_accounts || 0}
                </span>
              </div>

              {/* Suspicious Activity */}
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Suspicious Activity</p>
                    <p className="text-xs text-gray-500">Last 7 days</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-purple-800">
                  {stats?.security?.suspicious_activity || 0}
                </span>
              </div>

              {/* 2FA Adoption */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">2FA Enabled</p>
                    <p className="text-xs text-gray-500">User adoption rate</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-green-800">
                  {stats?.security?.two_factor_percentage || '0'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/users"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-xs text-gray-500 mt-1">View all users</p>
              </Link>

              <Link
                to="/transactions"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Transactions</p>
                <p className="text-xs text-gray-500 mt-1">View all transactions</p>
              </Link>

              <Link
                to="/login-logs"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Login Logs</p>
                <p className="text-xs text-gray-500 mt-1">Security monitoring</p>
              </Link>

              <Link
                to="/settings"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all group"
              >
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-red-200 transition-colors">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">System Settings</p>
                <p className="text-xs text-gray-500 mt-1">Configure system</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Comparison Widgets */}
      {kpiComparison && !chartLoading && (
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Key Performance Indicators</h2>
              <p className="text-sm text-gray-600 mt-1">Comparing current period vs previous period</p>
            </div>
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-blue-900">This Week vs Last Week</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <KPIWidget
              title="Transactions"
              current={kpiComparison.transactions?.current || 0}
              previous={kpiComparison.transactions?.previous || 0}
              change={kpiComparison.transactions?.change || 0}
              format="number"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              }
            />
            
            <KPIWidget
              title="Transaction Volume"
              current={kpiComparison.volume?.current || 0}
              previous={kpiComparison.volume?.previous || 0}
              change={kpiComparison.volume?.change || 0}
              format="currency"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              }
            />
            
            <KPIWidget
              title="Platform Revenue"
              current={kpiComparison.revenue?.current || 0}
              previous={kpiComparison.revenue?.previous || 0}
              change={kpiComparison.revenue?.change || 0}
              format="currency"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              }
            />
            
            <KPIWidget
              title="Active Users"
              current={kpiComparison.active_users?.current || 0}
              previous={kpiComparison.active_users?.previous || 0}
              change={kpiComparison.active_users?.change || 0}
              format="number"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              }
            />
            
            <KPIWidget
              title="Avg Transaction"
              current={kpiComparison.avg_transaction?.current || 0}
              previous={kpiComparison.avg_transaction?.previous || 0}
              change={kpiComparison.avg_transaction?.change || 0}
              format="currency"
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
                </svg>
              }
            />
          </div>
        </div>
      )}

      {/* Transaction Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-10">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Transaction Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Breakdown of transaction statuses and performance</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-600 mb-2">Pending Transactions</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.pending_transactions || 0}</p>
              <p className="text-xs text-gray-500 mt-2">Awaiting processing</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-gray-600 mb-2">Failed Transactions</p>
              <p className="text-3xl font-bold text-red-600">{stats?.failed_transactions || 0}</p>
              <p className="text-xs text-gray-500 mt-2">All time failures</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-2">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {stats?.total_transactions > 0 
                  ? ((1 - (stats?.failed_transactions || 0) / stats?.total_transactions) * 100).toFixed(1)
                  : 100
                }%
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {stats?.total_transactions - (stats?.failed_transactions || 0)} of {stats?.total_transactions} successful
              </p>
            </div>
          </div>
          
          {/* Additional Transaction Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Today</p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">{stats?.transactions_today || 0}</p>
                  <p className="text-xs text-gray-600">transactions</p>
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <p className="text-sm font-semibold text-blue-600">${(stats?.volume_today || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Volume</p>
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-green-600">${(stats?.revenue_today || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Revenue (Fees)</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">This Month</p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">{stats?.transactions_this_month || 0}</p>
                  <p className="text-xs text-gray-600">transactions</p>
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <p className="text-sm font-semibold text-blue-600">${(stats?.volume_this_month || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Volume</p>
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-green-600">${(stats?.revenue_this_month || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Revenue (Fees)</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">All Time</p>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900">{stats?.total_transactions || 0}</p>
                  <p className="text-xs text-gray-600">transactions</p>
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <p className="text-sm font-semibold text-blue-600">${(stats?.total_volume || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Volume</p>
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-green-600">${(stats?.total_revenue || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Revenue (Fees)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-8 mb-10">
        {/* Revenue & Volume Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Revenue & Volume Trend</h2>
              <p className="text-sm text-gray-600 mt-1">Track transaction volume and platform revenue over time</p>
            </div>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white hover:bg-gray-50 transition-colors"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
          <div className="mt-4">
            <RevenueVolumeChart data={revenueVolumeData} loading={chartLoading} />
          </div>
        </div>

        {/* Two column layout for pie and growth charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Transaction Types */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Transaction Types</h2>
              <p className="text-sm text-gray-600 mt-1">Breakdown of transaction categories (Last 30 Days)</p>
            </div>
            <div className="mt-4">
              <TransactionTypePieChart data={transactionTypesData} loading={chartLoading} />
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">User Growth</h2>
              <p className="text-sm text-gray-600 mt-1">New user registrations over the last 30 days</p>
            </div>
            <div className="mt-4">
              <UserGrowthChart data={userGrowthData} loading={chartLoading} />
            </div>
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Hourly Transaction Activity</h2>
            <p className="text-sm text-gray-600 mt-1">Transaction patterns throughout the day (Last 7 Days)</p>
          </div>
          <div className="mt-4">
            <HourlyActivityChart data={hourlyActivityData} loading={chartLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
