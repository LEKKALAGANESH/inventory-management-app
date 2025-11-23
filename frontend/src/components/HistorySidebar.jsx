import React, { useState, useEffect } from 'react';
import { productsAPI } from '../api/axios';

const HistorySidebar = ({ productId, onClose }) => {
  const [history, setHistory] = useState([]);
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [productId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getHistory(productId);
      setHistory(response.data.history);
      setProductName(response.data.product);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getChangeType = (oldQty, newQty) => {
    if (newQty > oldQty) return 'increase';
    if (newQty < oldQty) return 'decrease';
    return 'neutral';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Inventory History</h2>
              <p className="text-purple-100 text-sm mt-1">{productName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-100 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg
                className="h-16 w-16 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500">No history available</p>
              <p className="text-sm text-gray-400 mt-2">
                Changes will appear here when stock is updated
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => {
                const changeType = getChangeType(entry.old_quantity, entry.new_quantity);
                const diff = entry.new_quantity - entry.old_quantity;

                return (
                  <div
                    key={entry.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {changeType === 'increase' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg
                              className="h-5 w-5 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 10l7-7m0 0l7 7m-7-7v18"
                              />
                            </svg>
                          </div>
                        )}
                        {changeType === 'decrease' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <svg
                              className="h-5 w-5 text-red-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                              />
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Stock {changeType === 'increase' ? 'Increased' : 'Decreased'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(entry.change_date)}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          changeType === 'increase'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {diff > 0 ? '+' : ''}{diff}
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-center flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Previous
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {entry.old_quantity}
                        </div>
                      </div>
                      <div className="px-3">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          New
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {entry.new_quantity}
                        </div>
                      </div>
                    </div>

                    {entry.user_info && (
                      <div className="mt-3 flex items-center text-xs text-gray-500">
                        <svg
                          className="h-4 w-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Changed by: {entry.user_info}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;
