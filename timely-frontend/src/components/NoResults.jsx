export default function NoResults({ onClearFilters }) {
  return (
    <div className="text-center py-16">
      <div className="mb-6">
        <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">No events found</h3>
        <p className="text-slate-300 text-lg mb-6">
          No events match your current search criteria. Try adjusting your filters or search terms.
        </p>
      </div>
      
      {onClearFilters && (
        <button 
          onClick={onClearFilters}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-105 font-medium"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
