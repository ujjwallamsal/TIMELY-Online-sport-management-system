import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Trophy, 
  CheckCircle,
  AlertCircle,
  Save,
  ArrowLeft
} from 'lucide-react';
import { 
  useFixtures, 
  useResults,
  useCreateResult,
  useUpdateResult
} from '../../api/queries';
import { useAuth } from '../../auth/useAuth';
import { useToast } from '../../contexts/ToastContext';

const ResultsEnter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const fixtureId = searchParams.get('fixture');
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const { data: fixturesData } = useFixtures({
    coach: user?.id,
    page_size: 50,
  });

  const { data: resultsData, isLoading: resultsLoading } = useResults({
    fixture: fixtureId ? parseInt(fixtureId) : undefined,
  });

  const createResultMutation = useCreateResult();
  const updateResultMutation = useUpdateResult();

  const fixtures = fixturesData?.results || [];
  const existingResult = resultsData?.results?.[0];

  const [selectedFixture, setSelectedFixture] = useState(fixtureId ? parseInt(fixtureId) : '');
  const [homeScore, setHomeScore] = useState(existingResult?.home_score?.toString() || '');
  const [awayScore, setAwayScore] = useState(existingResult?.away_score?.toString() || '');
  const [notes, setNotes] = useState(existingResult?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFixtureData = fixtures?.find(f => f.id.toString() === selectedFixture);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFixture || !homeScore || !awayScore) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const resultData = {
        fixture: parseInt(selectedFixture.toString()),
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore),
        notes: notes || null,
        status: 'CONFIRMED' as const,
      };

      if (existingResult) {
        await updateResultMutation.mutateAsync({
          id: existingResult.id,
          ...resultData,
        });
        showSuccess('Result Updated', 'The result has been updated successfully');
      } else {
        await createResultMutation.mutateAsync(resultData);
        showSuccess('Result Recorded', 'The result has been recorded successfully');
      }

      // Reset form
      setHomeScore('');
      setAwayScore('');
      setNotes('');
    } catch (error) {
      showError('Submission Failed', 'Failed to record result. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedFixture && homeScore && awayScore;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => window.history.back()}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enter Results</h1>
              <p className="text-gray-600 mt-2">Record match results for your fixtures</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Results Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Match Result</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Fixture Selection */}
                <div>
                  <label className="form-label">Select Fixture</label>
                  <select
                    value={selectedFixture}
                    onChange={(e) => setSelectedFixture(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Choose a fixture...</option>
                    {fixtures
                      .filter(fixture => fixture.status === 'COMPLETED')
                      .map((fixture) => (
                        <option key={fixture.id} value={fixture.id}>
                          {fixture.home_team_name} vs {fixture.away_team_name} - {new Date(fixture.scheduled_date).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Selected Fixture Details */}
                {selectedFixtureData && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Fixture Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(selectedFixtureData.scheduled_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Venue:</span>
                        <span className="ml-2 text-gray-900">{selectedFixtureData.venue_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Round:</span>
                        <span className="ml-2 text-gray-900">{selectedFixtureData.round}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 status-badge ${
                          selectedFixtureData.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          selectedFixtureData.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedFixtureData.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Score Input */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">
                      {selectedFixtureData?.home_team_name || 'Home Team'} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="form-input text-center text-2xl font-bold"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      {selectedFixtureData?.away_team_name || 'Away Team'} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="form-input text-center text-2xl font-bold"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Add any additional notes about the match..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className="btn btn-primary inline-flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="spinner spinner-sm mr-2"></div>
                        {existingResult ? 'Updating...' : 'Recording...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {existingResult ? 'Update Result' : 'Record Result'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Recent Results */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Results</h3>
              {resultsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : resultsData?.results && resultsData.results.length > 0 ? (
                <div className="space-y-3">
                  {resultsData.results.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {result.home_score} - {result.away_score}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(result.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Trophy className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No results yet</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Select a completed fixture from the dropdown</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Enter the final scores for both teams</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Add any additional notes if needed</p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p>Results cannot be edited once confirmed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsEnter;