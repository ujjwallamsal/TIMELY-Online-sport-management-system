import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Calendar, 
  Clock,
  Save,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';
import { listFixtures, listResults, checkEndpointExists } from '../../api/admin';
import { Fixture, Result } from '../../api/types';
import { formatDateTime, formatRelativeTime } from '../../utils/date';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import ReasonModal from '../../components/ReasonModal';
import { useDeleteRequest } from '../../hooks/useDeleteRequest';

const CoachResultsEntry: React.FC = () => {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingResult, setEditingResult] = useState<Result | null>(null);
  const [resultForm, setResultForm] = useState({
    home_score: '',
    away_score: '',
    notes: '',
  });
  const [endpointStatus, setEndpointStatus] = useState<{[key: string]: boolean}>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<Result | null>(null);
  const { showSuccess, showError } = useToast();
  const { submitRequest, isSubmitting } = useDeleteRequest();

  // Load fixtures and results for this coach
  const loadData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load fixtures assigned to this coach
      const fixturesData = await listFixtures({
        // Assuming there's a coach field or we filter by team
        page_size: 50,
        ordering: '-scheduled_date',
      });

      // Load results recorded by this coach
      const resultsData = await listResults({
        recorded_by: user.id,
        page_size: 50,
        ordering: '-recorded_at',
      });

      setFixtures(fixturesData.results);
      setResults(resultsData.results);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load fixtures and results');
    } finally {
      setIsLoading(false);
    }
  };

  // Check endpoint availability
  useEffect(() => {
    const checkEndpoints = async () => {
      const [createExists, updateExists, deleteExists] = await Promise.all([
        checkEndpointExists('/api/results/'),
        checkEndpointExists('/api/results/1/'),
        checkEndpointExists('/api/results/1/'),
      ]);
      
      setEndpointStatus({
        create: createExists,
        update: updateExists,
        delete: deleteExists,
      });
    };

    checkEndpoints();
  }, []);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOCKED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFixtureStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleEditResult = (result: Result) => {
    setEditingResult(result);
    setResultForm({
      home_score: result.home_score?.toString() || '',
      away_score: result.away_score?.toString() || '',
      notes: result.notes || '',
    });
  };

  const handleSaveResult = async () => {
    if (!editingResult) return;

    try {
      if (endpointStatus.update) {
        await api.patch(ENDPOINTS.result(editingResult.id), {
          home_score: parseInt(resultForm.home_score) || null,
          away_score: parseInt(resultForm.away_score) || null,
          notes: resultForm.notes,
        });
        showSuccess('Result Updated', 'The result has been successfully updated.');
      } else {
        showError('Not Available', 'Result update is not available.');
        return;
      }
      
      setEditingResult(null);
      setResultForm({ home_score: '', away_score: '', notes: '' });
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Update error:', error);
      showError('Update Failed', 'Failed to update the result. Please try again.');
    }
  };

  const handleCreateResult = async (fixtureId: number) => {
    try {
      if (endpointStatus.create) {
        await api.post(ENDPOINTS.results, {
          fixture: fixtureId,
          home_score: parseInt(resultForm.home_score) || null,
          away_score: parseInt(resultForm.away_score) || null,
          notes: resultForm.notes,
        });
        showSuccess('Result Created', 'The result has been successfully created.');
      } else {
        showError('Not Available', 'Result creation is not available.');
        return;
      }
      
      setResultForm({ home_score: '', away_score: '', notes: '' });
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Create error:', error);
      showError('Create Failed', 'Failed to create the result. Please try again.');
    }
  };

  const handleDeleteResult = (result: Result) => {
    setResultToDelete(result);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (reason: string) => {
    if (!resultToDelete) return;

    try {
      await submitRequest(
        'result',
        resultToDelete.id,
        `Result for ${resultToDelete.fixture_details || `Fixture ${resultToDelete.fixture}`}`,
        reason
      );
      setShowDeleteModal(false);
      setResultToDelete(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Get fixtures that need results
  const fixturesNeedingResults = fixtures.filter(fixture => 
    fixture.status === 'COMPLETED' && 
    !results.some(result => result.fixture === fixture.id)
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadData}
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
              <h1 className="text-3xl font-bold text-gray-900">Results Entry</h1>
              <p className="text-gray-600 mt-2">Enter and manage match results for your fixtures</p>
            </div>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="btn btn-outline inline-flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Fixtures Needing Results */}
        {fixturesNeedingResults.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fixtures Needing Results</h3>
            <div className="space-y-4">
              {fixturesNeedingResults.map((fixture) => (
                <div key={fixture.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {fixture.home_team_name || `Team ${fixture.home_team}`} vs {fixture.away_team_name || `Team ${fixture.away_team}`}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(fixture.scheduled_date)} • {fixture.venue_name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingResult(null);
                      setResultForm({ home_score: '', away_score: '', notes: '' });
                      // Set fixture ID for creation
                      (resultForm as any).fixtureId = fixture.id;
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    Enter Result
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Results</h3>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {result.fixture_details || `Fixture ${result.fixture}`}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatRelativeTime(result.recorded_at)}
                      </p>
                      {result.home_score !== null && result.away_score !== null && (
                        <p className="text-sm font-bold text-gray-900">
                          {result.home_score} - {result.away_score}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`status-badge ${getStatusBadgeColor(result.status)}`}>
                      {result.status}
                    </span>
                    <button
                      onClick={() => handleEditResult(result)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit Result"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteResult(result)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete Result"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results yet</h3>
              <p className="text-gray-500">Results will appear here after you enter them</p>
            </div>
          )}
        </div>

        {/* Result Entry Modal */}
        {editingResult && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Result</h3>
                  <button
                    onClick={() => setEditingResult(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Home Score</label>
                      <input
                        type="number"
                        value={resultForm.home_score}
                        onChange={(e) => setResultForm({...resultForm, home_score: e.target.value})}
                        className="form-input"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="form-label">Away Score</label>
                      <input
                        type="number"
                        value={resultForm.away_score}
                        onChange={(e) => setResultForm({...resultForm, away_score: e.target.value})}
                        className="form-input"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">Notes</label>
                    <textarea
                      value={resultForm.notes}
                      onChange={(e) => setResultForm({...resultForm, notes: e.target.value})}
                      className="form-input"
                      rows={3}
                      placeholder="Additional notes about the match..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingResult(null)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveResult}
                    className="btn btn-primary inline-flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Result
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {resultToDelete && (
          <ReasonModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setResultToDelete(null);
            }}
            onSubmit={handleConfirmDelete}
            title="Delete Result"
            description="Are you sure you want to delete this result? This action requires approval."
            resourceType="result"
            resourceName={`Result for ${resultToDelete.fixture_details || `Fixture ${resultToDelete.fixture}`}`}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

export default CoachResultsEntry;
