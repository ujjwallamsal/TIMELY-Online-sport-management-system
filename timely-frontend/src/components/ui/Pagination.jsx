import React from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const showFirstEllipsis = visiblePages[0] > 2;
  const showLastEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1;

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <nav className={`flex items-center justify-between ${className}`} aria-label="Pagination">
      <div className="flex items-center gap-1">
        {/* First Page */}
        {showFirstLast && currentPage > 1 && (
          <button
            onClick={() => handlePageClick(1)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Go to first page"
          >
            <ChevronDoubleLeftIcon className="w-4 h-4" />
          </button>
        )}

        {/* Previous Page */}
        {showPrevNext && currentPage > 1 && (
          <button
            onClick={() => handlePageClick(currentPage - 1)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Go to previous page"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
        )}

        {/* First Ellipsis */}
        {showFirstEllipsis && (
          <span className="px-3 py-2 text-gray-500">...</span>
        )}

        {/* Page Numbers */}
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageClick(page)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        {/* Last Ellipsis */}
        {showLastEllipsis && (
          <span className="px-3 py-2 text-gray-500">...</span>
        )}

        {/* Next Page */}
        {showPrevNext && currentPage < totalPages && (
          <button
            onClick={() => handlePageClick(currentPage + 1)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Go to next page"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        )}

        {/* Last Page */}
        {showFirstLast && currentPage < totalPages && (
          <button
            onClick={() => handlePageClick(totalPages)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Go to last page"
          >
            <ChevronDoubleRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Page Info */}
      <div className="text-sm text-gray-700">
        Page {currentPage} of {totalPages}
      </div>
    </nav>
  );
};

export default Pagination;
