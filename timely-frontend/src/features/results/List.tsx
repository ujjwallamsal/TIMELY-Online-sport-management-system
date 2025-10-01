import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Calendar,
  Eye,
  AlertCircle,
  RefreshCw,
  Filter,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { formatDateTime } from '../../utils/date';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../contexts/ToastContext';

interface Result {
  id: number;
  fixture: number;
  fixture_display?: string;
  event_id?: number;
  event_name?: string;
  home_team_name?: string;
  away_team_name?: string;
  winner_name?: string;
  home_score?: number;
  away_score?: number;
  finalized_at?: string;
  created_at: string;
}

const ResultsList: React.FC = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [finalizedFilter, setFinalizedFilter] = useState<string>('all');

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const response = await api.get(ENDPOINTS.events);
        return response.data.results || response.data || [];
      } catch (error) {
        return [];
      }
    },
  });

  const { data: results, isLoading, error, refetch } = useQuery<Result[]>({
    queryKey: ['results', selectedEvent, finalizedFilter, user?.id],
    queryFn: async () => {
      try {
        const params: any = { page_size: 10 };
        
        // For coaches, optionally fetch results they recorded
        if (user?.role === 'COACH' && !selectedEvent) {
          params.recorded_by = user.id;
        }
        
        if (selectedEvent !== 'all') {
          const eventId = parseInt(selectedEvent);
          if (!isNaN(eventId)) {
            params.event_id = eventId;
          }
        }
        if (finalizedFilter !== 'all') {
          params.finalized = finalizedFilter === 'finalized';
        }
        
        const response = await api.get(ENDPOINTS.results, { params });
        
        // Normalize response to always return an array
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (data?.results && Array.isArray(data.results)) return data.results;
        
        return [];
      } catch (error: any) {
        console.error('Error fetching results:', error);
        showError('Couldn\'t load results right now', 'Please try again.');
        // Throw error so React Query marks this as an error state
        throw error;
      }
    },
    enabled: !!user, // Only fetch when user is loaded
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    staleTime: 15 * 1000,
    retry: 1, // Retry once on error
  });

  // Check if user is an athlete and filter results for their events
  const userResults = results?.filter(() => {
    // This filtering is actually done on the backend based on user role
    return true;
  }) || [];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Couldn't load results right now</h3>
            <p className="text-gray-600 mb-4">Please try again.</p>
            <button onClick={() => refetch()} className="btn btn-primary inline-flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Results</h1>
          <p className="text-gray-600">View competition results and standings</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Event
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="form-input"
              >
                <option value="all">All Events</option>
                {events?.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Status
              </label>
              <select
                value={finalizedFilter}
                onChange={(e) => setFinalizedFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Results</option>
                <option value="finalized">Finalized Only</option>
                <option value="provisional">Provisional</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : userResults && userResults.length > 0 ? (
            userResults.map((result) => (
              <div key={result.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {result.event_name || `Event #${result.event_id}`}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          {result.finalized_at ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Final
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Provisional
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {result.home_team_name && result.away_team_name ? (
                        <div className="flex items-center space-x-4 text-lg">
                          <span className={`font-medium ${result.winner_name === result.home_team_name ? 'text-blue-600' : 'text-gray-700'}`}>
                            {result.home_team_name}
                          </span>
                          <span className="text-2xl font-bold text-gray-900">
                            {result.home_score ?? '—'}
                          </span>
                          <span className="text-gray-400">vs</span>
                          <span className="text-2xl font-bold text-gray-900">
                            {result.away_score ?? '—'}
                          </span>
                          <span className={`font-medium ${result.winner_name === result.away_team_name ? 'text-blue-600' : 'text-gray-700'}`}>
                            {result.away_team_name}
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-600">{result.fixture_display || `Fixture #${result.fixture}`}</p>
                      )}

                      {result.winner_name && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                          <span>Winner: <strong>{result.winner_name}</strong></span>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {result.finalized_at 
                            ? `Finalized ${formatDateTime(result.finalized_at)}`
                            : `Posted ${formatDateTime(result.created_at)}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {result.event_id && (
                      <Link
                        to={`/events/${result.event_id}`}
                        className="btn btn-secondary flex items-center justify-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Event
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Available</h3>
              <p className="text-gray-500">
                {selectedEvent !== 'all' || finalizedFilter !== 'all'
                  ? 'No results match your filters. Try adjusting your search.'
                  : user?.role === 'ATHLETE'
                  ? 'Results will appear here after you participate in events and results are posted.'
                  : 'No results have been posted yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsList;
