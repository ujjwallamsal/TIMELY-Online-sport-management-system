import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, DollarSign, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reportsAPI } from '../services/api';
import ReportFilters from '../components/ReportFilters';
import ReportTable from '../components/ReportTable';
import ExportButton from '../components/ExportButton';

const Reports = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('registrations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [reportData, setReportData] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [divisions, setDivisions] = useState([]);

  // Check if user has permission to view reports
  const canViewReports = user && (user.role === 'ADMIN' || user.role === 'ORGANIZER');

  // Load initial data
  useEffect(() => {
    if (canViewReports) {
      loadInitialData();
    }
  }, [canViewReports]);

  // Load report data when filters change
  useEffect(() => {
    if (canViewReports && Object.keys(filters).length > 0) {
      loadReportData();
    }
  }, [filters, activeTab, canViewReports]);

  const loadInitialData = async () => {
    try {
      // Load events, sports, and divisions for filters
      const [eventsRes, sportsRes, divisionsRes] = await Promise.all([
        reportsAPI.getEvents(),
        reportsAPI.getSports(),
        reportsAPI.getDivisions()
      ]);
      
      setEvents(eventsRes.data || []);
      setSports(sportsRes.data || []);
      setDivisions(divisionsRes.data || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await reportsAPI.getReport(activeTab, filters);
      setReportData(response.data);
      
      // Set pagination if available
      if (response.data && (response.data.results || response.data.rows)) {
        setPagination({
          page: response.data.page || 1,
          page_size: response.data.page_size || 20,
          count: response.data.count || response.data.rows?.length || 0,
          total_pages: response.data.total_pages || 1,
          next: response.data.next || false,
          previous: response.data.previous || false
        });
      } else {
        setPagination(null);
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = (page) => {
    if (pagination && page !== pagination.page) {
      setFilters(prev => ({ ...prev, page }));
    }
  };

  const handleExport = async (reportType, exportFilters) => {
    try {
      const response = await reportsAPI.exportReport(reportType, exportFilters);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  };

  const getTableColumns = () => {
    switch (activeTab) {
      case 'registrations':
        return [
          { key: 'user_name', header: 'User Name', type: 'text' },
          { key: 'user_email', header: 'Email', type: 'text' },
          { key: 'event_name', header: 'Event', type: 'text' },
          { key: 'event_sport', header: 'Sport', type: 'text' },
          { key: 'division_name', header: 'Division', type: 'text' },
          { key: 'status', header: 'Status', type: 'status' },
          { key: 'kyc_status', header: 'KYC Status', type: 'status' },
          { key: 'created_at', header: 'Registered', type: 'datetime' }
        ];
      
      case 'revenue':
        return [
          { key: 'event_name', header: 'Event', type: 'text' },
          { key: 'user_name', header: 'Customer', type: 'text' },
          { key: 'user_email', header: 'Email', type: 'text' },
          { key: 'total_cents', header: 'Amount', type: 'currency', align: 'right' },
          { key: 'ticket_count', header: 'Tickets', type: 'number', align: 'center' },
          { key: 'status', header: 'Status', type: 'status' },
          { key: 'created_at', header: 'Date', type: 'datetime' }
        ];
      
      case 'attendance':
        return [
          { key: 'event_name', header: 'Event', type: 'text' },
          { key: 'user_name', header: 'Customer', type: 'text' },
          { key: 'user_email', header: 'Email', type: 'text' },
          { key: 'ticket_count', header: 'Tickets', type: 'number', align: 'center' },
          { key: 'scanned_count', header: 'Scanned', type: 'number', align: 'center' },
          { key: 'attendance_rate', header: 'Attendance Rate', type: 'percentage', align: 'center' },
          { key: 'event_date', header: 'Event Date', type: 'datetime' }
        ];
      
      case 'performance':
        return [
          { key: 'team', header: 'Team', type: 'text' },
          { key: 'games_played', header: 'Games', type: 'number', align: 'center' },
          { key: 'wins', header: 'Wins', type: 'number', align: 'center' },
          { key: 'losses', header: 'Losses', type: 'number', align: 'center' },
          { key: 'draws', header: 'Draws', type: 'number', align: 'center' },
          { key: 'points_for', header: 'Points For', type: 'number', align: 'center' },
          { key: 'points_against', header: 'Points Against', type: 'number', align: 'center' },
          { key: 'point_difference', header: 'Point Diff', type: 'number', align: 'center' },
          { key: 'win_percentage', header: 'Win %', type: 'percentage', align: 'center' }
        ];
      
      default:
        return [];
    }
  };

  const getTableData = () => {
    if (!reportData) return [];
    
    switch (activeTab) {
      case 'registrations':
        return reportData.results || [];
      case 'revenue':
        return reportData.rows || [];
      case 'attendance':
        return reportData.rows || [];
      case 'performance':
        return reportData.standings || [];
      default:
        return [];
    }
  };

  const getSummaryData = () => {
    if (!reportData) return null;
    
    switch (activeTab) {
      case 'revenue':
        return reportData.totals;
      case 'attendance':
        return reportData.summary;
      case 'performance':
        return reportData.summary;
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'registrations', label: 'Registrations', icon: Users },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'attendance', label: 'Attendance', icon: TrendingUp },
    { id: 'performance', label: 'Performance', icon: BarChart3 }
  ];

  if (!canViewReports) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FileText className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to view reports. Only organizers and administrators can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-gray-600">
            View and analyze registrations, revenue, attendance, and performance data.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`mr-2 h-5 w-5 ${
                      activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ReportFilters
            onFiltersChange={handleFiltersChange}
            events={events}
            sports={sports}
            divisions={divisions}
            loading={loading}
          />
        </div>

        {/* Summary Cards */}
        {getSummaryData() && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(getSummaryData()).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm font-medium text-gray-500 capitalize">
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' && key.includes('cents') 
                    ? `$${(value / 100).toFixed(2)}`
                    : value
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export Button */}
        <div className="mb-4 flex justify-end">
          <ExportButton
            reportType={activeTab}
            filters={filters}
            onExport={handleExport}
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Table */}
        <ReportTable
          data={getTableData()}
          columns={getTableColumns()}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          stickyHeader={true}
        />
      </div>
    </div>
  );
};

export default Reports;