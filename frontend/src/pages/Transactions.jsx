import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filter, setFilter] = useState('all'); // all, sent, received
  const [searchTerm, setSearchTerm] = useState('');
  const [balance, setBalance] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    recipient_email: '',
    amount: '',
    description: '',
    transaction_type: 'payment'
  });

  // Fee preview state
  const [feePreview, setFeePreview] = useState(null);
  const [loadingFee, setLoadingFee] = useState(false);

  // Refund form state
  const [refundReason, setRefundReason] = useState('');

  // Permission checks
  const canViewAll = user?.permissions?.some(p => p.slug === 'view-all-transactions');
  const canCreate = user?.permissions?.some(p => p.slug === 'create-transactions');

  useEffect(() => {
    fetchTransactions();
    fetchUserBalance();
  }, []);

  const fetchUserBalance = async () => {
    try {
      const response = await api.get('/user');
      setBalance(response.data.user.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transactions');
      // Handle Laravel pagination structure
      setTransactions(response.data.data || response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely format amount
  const formatAmount = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toFixed(2);
  };

  // Fetch fee preview when amount or type changes
  const fetchFeePreview = async (amount, type) => {
    if (!amount || parseFloat(amount) <= 0) {
      setFeePreview(null);
      return;
    }

    try {
      setLoadingFee(true);
      const response = await api.post('/transactions/preview-fee', {
        amount: parseFloat(amount),
        type: type
      });
      setFeePreview(response.data);
    } catch (error) {
      console.error('Error fetching fee preview:', error);
      setFeePreview(null);
    } finally {
      setLoadingFee(false);
    }
  };

  // Update amount handler with fee preview
  const handleAmountChange = (value) => {
    setFormData({ ...formData, amount: value });
    if (value && parseFloat(value) > 0) {
      fetchFeePreview(value, formData.transaction_type);
    } else {
      setFeePreview(null);
    }
  };

  // Update type handler with fee preview
  const handleTypeChange = (type) => {
    setFormData({ ...formData, transaction_type: type });
    if (formData.amount && parseFloat(formData.amount) > 0) {
      fetchFeePreview(formData.amount, type);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Show confirmation modal instead of submitting directly
    setShowConfirmModal(true);
  };

  const handleConfirmTransaction = async () => {
    try {
      await api.post('/transactions', {
        recipient_email: formData.recipient_email,
        amount: parseFloat(formData.amount),
        description: formData.description,
        type: formData.transaction_type
      });
      
      alert('Transaction created successfully!');
      setShowCreateModal(false);
      setShowConfirmModal(false);
      setFormData({
        recipient_email: '',
        amount: '',
        description: '',
        transaction_type: 'payment'
      });
      setFeePreview(null);
      fetchTransactions();
      fetchUserBalance(); // Refresh balance after transaction
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert(error.response?.data?.message || 'Failed to create transaction');
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/transactions/${selectedTransaction.id}/refund`, {
        reason: refundReason
      });
      
      alert('Transaction refunded successfully!');
      setShowRefundModal(false);
      setSelectedTransaction(null);
      setRefundReason('');
      fetchTransactions();
      fetchUserBalance(); // Refresh balance after refund
    } catch (error) {
      console.error('Error refunding transaction:', error);
      alert(error.response?.data?.message || 'Failed to refund transaction');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'payment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'refund':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
    }
  };

  const filteredTransactions = transactions.filter(t => {
    // Filter by user if not admin/manager
    if (!canViewAll && user) {
      if (t.sender.id !== user.id && t.recipient.id !== user.id) {
        return false;
      }
    }

    // Filter by type
    if (filter === 'sent' && t.sender.id !== user?.id) return false;
    if (filter === 'received' && t.recipient.id !== user?.id) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        t.sender.name.toLowerCase().includes(search) ||
        t.recipient.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.amount.toString().includes(search)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm mb-1">Your Balance</p>
            <h2 className="text-4xl font-bold">${parseFloat(balance || 0).toFixed(2)}</h2>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {canViewAll ? 'View all system transactions' : 'View your transaction history'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Transaction
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'sent'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setFilter('received')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'received'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Received
            </button>
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-2 ${transaction.type === 'payment' ? 'text-green-600' : 'text-blue-600'}`}>
                        {getTypeIcon(transaction.type)}
                        <span className="text-sm font-medium capitalize">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{transaction.sender.name}</div>
                        <div className="text-gray-500">{transaction.sender.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{transaction.recipient.name}</div>
                        <div className="text-gray-500">{transaction.recipient.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${formatAmount(transaction.amount)} {transaction.currency}
                      </div>
                      {transaction.description && (
                        <div className="text-xs text-gray-500">{transaction.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {canCreate && 
                       transaction.status === 'completed' && 
                       !transaction.is_refunded && 
                       transaction.type !== 'refund' && 
                       transaction.sender.id === user?.id && (
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowRefundModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Refund
                        </button>
                      )}
                      {transaction.is_refunded && (
                        <span className="text-gray-500 text-xs">Refunded</span>
                      )}
                      {transaction.type === 'refund' && transaction.original_transaction_id && (
                        <span className="text-gray-500 text-xs">Refund of #{transaction.original_transaction_id}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Transaction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">New Transaction</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.recipient_email}
                  onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="recipient@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="payment">Payment (Goods/Services)</option>
                  <option value="transfer">Transfer (Friends & Family - FREE)</option>
                  <option value="refund">Refund</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.transaction_type === 'payment' && 'Fee: 2.9% + $0.30'}
                  {formData.transaction_type === 'transfer' && 'No fees for transfers'}
                  {formData.transaction_type === 'refund' && 'Fee will be returned'}
                </p>
              </div>

              {/* Real-time Fee Breakdown */}
              {feePreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">💰 Fee Breakdown</span>
                    {loadingFee && <span className="text-xs text-gray-500">Calculating...</span>}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-gray-900">${feePreview.amount.toFixed(2)}</span>
                    </div>
                    {feePreview.fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction Fee:</span>
                        <span className="font-medium text-orange-600">${feePreview.fee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-blue-300 pt-1.5 flex justify-between">
                      <span className="font-semibold text-gray-700">You Pay:</span>
                      <span className="font-bold text-gray-900">${feePreview.total_required.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Recipient Gets:</span>
                      <span className="font-medium">${feePreview.breakdown.recipient_receives.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="What is this transaction for?"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Send Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && feePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">Confirm Transaction</h2>
            <p className="text-gray-500 text-center mb-6 text-sm">
              Please review the details before sending money
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Recipient</span>
                <span className="font-semibold text-gray-900">{formData.recipient_email}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Type</span>
                <span className="font-medium text-gray-700">
                  {formData.transaction_type === 'payment' ? '💳 Payment' : 
                   formData.transaction_type === 'transfer' ? '🎁 Transfer (Free)' : '↩️ Refund'}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium text-gray-900">${feePreview.amount.toFixed(2)}</span>
                </div>
                
                {feePreview.fee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transaction Fee</span>
                    <span className="font-medium text-orange-600">+${feePreview.fee.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                  <span className="font-bold text-gray-700 text-lg">Total</span>
                  <span className="font-bold text-gray-900 text-xl">${feePreview.total_required.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-2 mt-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700">✓ Recipient receives</span>
                  <span className="font-semibold text-green-800">${feePreview.breakdown.recipient_receives.toFixed(2)}</span>
                </div>
              </div>

              {formData.description && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <span className="text-gray-600 text-sm block mb-1">Description</span>
                  <p className="text-gray-800 text-sm">{formData.description}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransaction}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Refund Transaction</h2>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedTransaction(null);
                  setRefundReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Transaction Details:</strong>
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                Amount: <strong>${formatAmount(selectedTransaction.amount)} {selectedTransaction.currency}</strong>
              </p>
              <p className="text-sm text-yellow-700">
                To: <strong>{selectedTransaction.recipient.name}</strong>
              </p>
              <p className="text-sm text-yellow-700">
                Date: <strong>{new Date(selectedTransaction.created_at).toLocaleDateString()}</strong>
              </p>
            </div>

            <form onSubmit={handleRefund} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  minLength={10}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="Please provide a detailed reason for the refund (minimum 10 characters)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 10 characters required
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    setSelectedTransaction(null);
                    setRefundReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Process Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
