import React, { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ExportButton = ({ 
  reportType, 
  filters = {}, 
  onExport, 
  disabled = false,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null); // 'success', 'error', null

  const handleExport = async () => {
    if (isExporting || disabled) return;

    setIsExporting(true);
    setExportStatus(null);

    try {
      await onExport(reportType, filters);
      setExportStatus('success');
      
      // Reset success status after 3 seconds
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      
      // Reset error status after 5 seconds
      setTimeout(() => setExportStatus(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const getButtonContent = () => {
    if (isExporting) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Exporting...</span>
        </>
      );
    }

    if (exportStatus === 'success') {
      return (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Exported!</span>
        </>
      );
    }

    if (exportStatus === 'error') {
      return (
        <>
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span>Export Failed</span>
        </>
      );
    }

    return (
      <>
        <Download className="h-4 w-4" />
        <span>Export CSV</span>
      </>
    );
  };

  const getButtonStyles = () => {
    const baseStyles = "inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
    
    if (isExporting) {
      return `${baseStyles} bg-blue-100 text-blue-800 cursor-not-allowed`;
    }
    
    if (exportStatus === 'success') {
      return `${baseStyles} bg-green-100 text-green-800 border-green-200`;
    }
    
    if (exportStatus === 'error') {
      return `${baseStyles} bg-red-100 text-red-800 border-red-200`;
    }
    
    if (disabled) {
      return `${baseStyles} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }
    
    return `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleExport}
        disabled={isExporting || disabled}
        className={getButtonStyles()}
        title={`Export ${reportType} report to CSV`}
      >
        {getButtonContent()}
      </button>
      
      {/* Status message */}
      {exportStatus === 'error' && (
        <div className="text-sm text-red-600">
          Failed to export. Please try again.
        </div>
      )}
    </div>
  );
};

export default ExportButton;
