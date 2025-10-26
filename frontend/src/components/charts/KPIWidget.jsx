export default function KPIWidget({ title, current, previous, change, icon, format = 'number' }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  const formatValue = (value) => {
    if (format === 'currency') {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
        {icon && (
          <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-blue-600 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Current Value */}
        <div>
          <div className="text-3xl font-bold text-gray-900 leading-tight">
            {formatValue(current)}
          </div>
          <div className="text-xs text-gray-500 mt-2 font-medium">Current Period</div>
        </div>

        {/* Change Indicator */}
        <div className="flex items-center flex-wrap gap-2">
          {change !== 0 && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
              ${isPositive ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 
                isNegative ? 'bg-red-100 text-red-700 ring-1 ring-red-200' : 
                'bg-gray-100 text-gray-700 ring-1 ring-gray-200'}`}>
              {isPositive && (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {isNegative && (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
          {change === 0 && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 ring-1 ring-gray-200">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
              No change
            </div>
          )}
        </div>

        {/* Previous Value */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Previous:</span>
            <span className="font-semibold text-gray-900">{formatValue(previous)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
