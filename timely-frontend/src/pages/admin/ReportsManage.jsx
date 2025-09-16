// src/pages/admin/ReportsManage.jsx
import React, { useState } from 'react';
import { 
  Download,
  FileText,
  Users,
  Calendar,
  Trophy,
  BarChart3
} from 'lucide-react';

const ReportsManage = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [filters, setFilters] = useState({
    event: '',
    dateFrom: '',
    dateTo: ''
  });

  const reportTypes = [
    {
      id: 'events',
      name: 'Events Report',
      description: 'Export all events with details',
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      id: 'registrations',
      name: 'Registrations Report',
      description: 'Export all registrations with status',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      id: 'fixtures',
      name: 'Fixtures Report',
      description: 'Export all fixtures and schedules',
      icon: Calendar,
      color: 'bg-purple-500'
    },
    {
      id: 'results',
      name: 'Results Report',
      description: 'Export all results and scores',
      icon: Trophy,
      color: 'bg-orange-500'
    }
  ];

  const handleDownloadReport = async (reportType) => {
    try {
      // API call to download report
      console.log('Downloading report:', reportType, filters);
      
      // Create a mock download link
      const link = document.createElement('a');
      link.href = `#`; // Replace with actual API endpoint
      link.download = `${reportType}_report.csv`;
      link.click();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const ReportCard = ({ report }) => {
    const Icon = report.icon;
    
    return (
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center mb-4">
          <div className={`p-3 rounded-full ${report.color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
            <p className="text-sm text-gray-600">{report.description}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Filter
            </label>
            <select
              value={filters.event}
              onChange={(e) => setFilters(prev => ({ ...prev, event: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Events</option>
              <option value="basketball">Basketball Championship</option>
              <option value="soccer">Soccer League</option>
              <option value="tennis">Tennis Tournament</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={() => handleDownloadReport(report.id)}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <BarChart3 className="h-4 w-4" />
          <span>Export data in CSV format</span>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">245</div>
            <div className="text-sm text-gray-600">Total Registrations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">48</div>
            <div className="text-sm text-gray-600">Total Fixtures</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">32</div>
            <div className="text-sm text-gray-600">Completed Results</div>
          </div>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Exports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exported At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Events Report
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  All Events
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Jan 1 - Jan 31, 2024
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  2024-01-20 14:30
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  12
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Download className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Registrations Report
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Basketball Championship
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Jan 1 - Jan 31, 2024
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  2024-01-19 10:15
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  45
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Download className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsManage;
