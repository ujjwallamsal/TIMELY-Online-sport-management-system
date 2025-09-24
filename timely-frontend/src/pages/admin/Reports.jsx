import React, { useEffect, useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import api from '../../services/api.js';
import { 
  DocumentArrowDownIcon,
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  TrophyIcon,
  TicketIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function AdminReports() {
  const { push } = useToast();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await api.getEvents({ page_size: 100 });
        const data = response.results || response.data || [];
        setEvents(data);
      } catch (err) {
        push({ type: 'error', title: 'Failed to load events', message: err.message || 'Please try again.' });
      }
    };
    loadEvents();
  }, [push]);

  const downloadCSV = async (reportType) => {
    if (!selectedEvent) {
      push({ type: 'error', title: 'No event selected', message: 'Please select an event first.' });
      return;
    }

    setDownloading(reportType);
    try {
      const response = await api.get(`/reports/${reportType}.csv?event=${selectedEvent}`, {
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_event_${selectedEvent}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      push({ type: 'success', title: 'Report downloaded', message: `${reportType} report downloaded successfully.` });
    } catch (err) {
      push({ type: 'error', title: 'Download failed', message: err.message || 'Please try again.' });
    } finally {
      setDownloading(null);
    }
  };

  const reportTypes = [
    {
      id: 'registrations',
      name: 'Registrations',
      description: 'Download participant registrations for the selected event',
      icon: UsersIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'fixtures',
      name: 'Fixtures',
      description: 'Download event fixtures and schedule',
      icon: CalendarIcon,
      color: 'bg-green-500'
    },
    {
      id: 'results',
      name: 'Results',
      description: 'Download match results and scores',
      icon: TrophyIcon,
      color: 'bg-yellow-500'
    },
    {
      id: 'ticket_sales',
      name: 'Ticket Sales',
      description: 'Download ticket sales and revenue data',
      icon: TicketIcon,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Download CSV reports for events and analytics</p>
        </div>
        <ChartBarIcon className="h-8 w-8 text-gray-400" />
      </div>

      {/* Event Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Event</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Choose an event to generate reports for</label>
            <Select 
              value={selectedEvent} 
              onChange={(value) => setSelectedEvent(value)}
              options={[
                { value: '', label: 'Select an event...' },
                ...events.map((event) => ({ value: event.id, label: event.name }))
              ]}
            />
          </div>
          <div className="pt-6">
            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              {events.length} events available
            </div>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          const isDownloading = downloading === report.id;
          
          return (
            <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className={`${report.color} rounded-lg p-3 mr-4`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              
              <Button
                onClick={() => downloadCSV(report.id)}
                disabled={!selectedEvent || isDownloading}
                className="w-full flex items-center justify-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    Download CSV
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">How to use reports:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Select an event from the dropdown above</li>
          <li>• Click on any report type to download the CSV file</li>
          <li>• Reports include all relevant data for the selected event</li>
          <li>• CSV files can be opened in Excel, Google Sheets, or any spreadsheet application</li>
        </ul>
      </div>
    </div>
  );
}


