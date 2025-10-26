import PropTypes from 'prop-types';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  perPage, 
  totalItems,
  onPageChange, 
  onPerPageChange 
}) {
  const pageNumbers = [];
  
  // Calculate which page numbers to show
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  // Adjust startPage if we're near the end
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200">
      {/* Results info */}
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-4">
        {/* Per page selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="perPage" className="text-sm text-gray-700">
            Per page:
          </label>
          <select
            id="perPage"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Pagination controls */}
        <nav className="flex items-center gap-1">
          {/* Previous button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
          >
            Previous
          </button>

          {/* First page */}
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="px-2 text-gray-500">...</span>
              )}
            </>
          )}

          {/* Page numbers */}
          {pageNumbers.map((number) => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`px-3 py-1 rounded-lg border text-sm font-medium transition-colors ${
                currentPage === number
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {number}
            </button>
          ))}

          {/* Last page */}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  perPage: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPerPageChange: PropTypes.func.isRequired,
};
