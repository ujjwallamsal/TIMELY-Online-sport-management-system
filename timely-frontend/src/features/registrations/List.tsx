import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  User,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useRegistrations } from '../../api/queries';
import { formatDateTime, formatRelativeTime } from '../../utils/date';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';

interface DenormalizedRegistration {
  id: number;
  event: number;
  event_name: string;
  user: number;
  user_name: string;
  team: number | null;
  team_name?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  registration_date: string;
  notes: string | null;
}

const RegistrationsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [denormalizedData, setDenormalizedData] = useState<DenormalizedRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useToast();

  const { data: registrationsData, isLoading: registrationsLoading, error } = useRegistrations({
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page_size: 100,
  });

  // Data joining logic
  useEffect(() => {
    const joinData = async () => {
      if (!registrationsData?.results) return;

      setIsLoading(true);
      try {
        const registrations = registrationsData.results;
        
        // Collect unique event and user IDs
        const eventIds = [...new Set(registrations.map(r => r.event))];
        const userIds = [...new Set(registrations.map(r => r.user))];

        // Fetch events and users in parallel using proper API client
        const [eventsResponse, usersResponse] = await Promise.all([
          Promise.all(eventIds.map(id => 
            api.get(ENDPOINTS.event(id)).then(res => res.data).catch(() => ({ id, name: 'Unknown Event' }))
          )),
          Promise.all(userIds.map(id => 
            api.get(ENDPOINTS.users + `${id}/`).then(res => res.data).catch(() => ({ id, first_name: 'Unknown', last_name: 'User' }))
          ))
        ]);

        // Create lookup maps
        const eventsMap = new Map(eventsResponse.map(e => [e.id, e]));
        const usersMap = new Map(usersResponse.map(u => [u.id, u]));

        // Denormalize registrations
        const denormalized = registrations.map(reg => ({
          ...reg,
          event_name: eventsMap.get(reg.event)?.name || 'Unknown Event',
          user_name: usersMap.get(reg.user) ? 
            `${usersMap.get(reg.user).first_name} ${usersMap.get(reg.user).last_name}` : 
            'Unknown User'
        }));

        setDenormalizedData(denormalized);
      } catch (error) {
        console.error('Error joining data:', error);
        showError('Data Loading Error', 'Failed to load registration details');
      } finally {
        setIsLoading(false);
      }
    };

    joinData();
  }, [registrationsData, showError]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Registrations</h3>
              <p className="text-gray-600 mb-4">Unable to load registrations data. This might be a temporary issue.</p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary inline-flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </button>
            </div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Registrations</h1>
              <p className="text-gray-600 mt-2">Manage event registrations and approvals</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="form-label">Search Registrations</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by event name or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="form-label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="card">
          {registrationsLoading || isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : denormalizedData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {denormalizedData.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {registration.event_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Event #{registration.event}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {registration.user_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              User #{registration.user}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {formatDateTime(registration.registration_date)}
                        </div>
                        <div className="text-gray-500">
                          {formatRelativeTime(registration.registration_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`status-badge ${getStatusBadgeColor(registration.status)} flex items-center`}>
                            {getStatusIcon(registration.status)}
                            <span className="ml-1">{registration.status}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate">
                          {registration.notes || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/events/${registration.event}`}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Event"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No registrations have been submitted yet'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {registrationsData && registrationsData.count > 100 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {denormalizedData.length} of {registrationsData.count} registrations
            </div>
            <div className="flex space-x-2">
              <button className="btn btn-outline btn-sm" disabled>
                Previous
              </button>
              <button className="btn btn-outline btn-sm" disabled>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationsList;
