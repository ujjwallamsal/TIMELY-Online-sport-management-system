import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { useEventFixtures, useCreateResult, useUpdateResult } from '../../api/queries';
import { useToast } from '../../contexts/ToastContext';
import { Form, FormGroup, FormRow, FormActions, Input, Button } from '../../components/Form';
import { CheckCircle, Lock, Unlock, Save, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

interface FixtureResultData {
  fixture_id: number;
  home_score: number;
  away_score: number;
  notes?: string;
}

// const resultSchema = {
//   fixture_id: { required: true, type: 'number' },
//   home_score: { required: true, type: 'number', min: 0 },
//   away_score: { required: true, type: 'number', min: 0 },
//   notes: { required: false, type: 'string' },
// };

const ResultsEntry: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [editingResult, setEditingResult] = useState<number | null>(null);
  const [lockedResults, setLockedResults] = useState<Set<number>>(new Set());
  
  const { data: fixtures, isLoading: fixturesLoading, refetch } = useEventFixtures(
    parseInt(eventId || '0')
  );
  
  const createResultMutation = useCreateResult();
  const updateResultMutation = useUpdateResult();

  const form = useForm<FixtureResultData>({
    initialValues: {
      fixture_id: 0,
      home_score: 0,
      away_score: 0,
      notes: '',
    },
    validationSchema: z.object({
      fixture_id: z.number().min(1, 'Please select a fixture'),
      home_score: z.number().min(0, 'Score must be non-negative'),
      away_score: z.number().min(0, 'Score must be non-negative'),
      notes: z.string().optional(),
    }),
    onSubmit: async (values) => {
      try {
        if (editingResult) {
          await updateResultMutation.mutateAsync({
            id: editingResult,
            ...values,
          });
          showSuccess('Result Updated', 'The result has been updated successfully.');
        } else {
          await createResultMutation.mutateAsync(values);
          showSuccess('Result Recorded', 'The result has been recorded successfully.');
        }
        
        setEditingResult(null);
        form.reset();
        refetch();
      } catch (error) {
        showError('Error', 'Failed to save result. Please try again.');
      }
    },
  });

  const handleEditResult = (fixture: any) => {
    if (lockedResults.has(fixture.id)) return;
    
    setEditingResult(fixture.id);
    form.setValues({
      fixture_id: fixture.id,
      home_score: fixture.result?.home_score || 0,
      away_score: fixture.result?.away_score || 0,
      notes: fixture.result?.notes || '',
    });
  };

  const handleLockResult = (resultId: number) => {
    setLockedResults(prev => new Set(prev).add(resultId));
    showSuccess('Result Locked', 'This result has been locked and cannot be modified.');
  };

  const handleUnlockResult = (resultId: number) => {
    setLockedResults(prev => {
      const newSet = new Set(prev);
      newSet.delete(resultId);
      return newSet;
    });
    showSuccess('Result Unlocked', 'This result can now be modified.');
  };

  if (fixturesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!fixtures || fixtures.results?.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Fixtures Found</h3>
            <p className="text-gray-500">No fixtures have been generated for this event yet.</p>
            <button
              onClick={() => navigate(`/events/${eventId}/fixtures/generate`)}
              className="mt-4 btn btn-primary"
            >
              Generate Fixtures
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/events/${eventId}`)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Event
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Results Entry</h1>
                <p className="text-gray-600 mt-2">Enter and manage match results for this event</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Form */}
        {editingResult && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingResult ? 'Edit Result' : 'Record Result'}
            </h2>
            
            <Form onSubmit={form.handleSubmit}>
              <FormRow>
                <FormGroup>
                  <Input
                    label="Home Team Score"
                    name="home_score"
                    type="number"
                    min="0"
                    value={form.values.home_score}
                    onChange={(e) => form.setValue('home_score', parseInt(e.target.value) || 0)}
                    error={form.errors.home_score}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Input
                    label="Away Team Score"
                    name="away_score"
                    type="number"
                    min="0"
                    value={form.values.away_score}
                    onChange={(e) => form.setValue('away_score', parseInt(e.target.value) || 0)}
                    error={form.errors.away_score}
                    required
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Input
                  label="Notes (Optional)"
                  name="notes"
                  value={form.values.notes}
                  onChange={(e) => form.setValue('notes', e.target.value)}
                  error={form.errors.notes}
                  placeholder="Additional notes about the match"
                />
              </FormGroup>

              <FormActions>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingResult(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={form.isSubmitting}
                  disabled={!form.isValid || form.isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingResult ? 'Update Result' : 'Save Result'}
                </Button>
              </FormActions>
            </Form>
          </div>
        )}

        {/* Fixtures List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Event Fixtures</h2>
          
          <div className="grid gap-4">
            {fixtures.results?.map((fixture) => {
              const hasResult = (fixture as any).result;
              const isLocked = lockedResults.has(fixture.id);
              const isEditing = editingResult === fixture.id;
              
              return (
                <div key={fixture.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="text-lg font-medium text-gray-900">
                                {fixture.home_team_name || `Team ${fixture.home_team}`}
                              </div>
                              <div className="text-gray-500">vs</div>
                              <div className="text-lg font-medium text-gray-900">
                                {fixture.away_team_name || `Team ${fixture.away_team}`}
                              </div>
                            </div>
                            
                            {hasResult && (
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-gray-900">
                                  {(fixture as any).result?.home_score} - {(fixture as any).result?.away_score}
                                </span>
                                {isLocked && (
                                  <Lock className="h-5 w-5 text-red-500" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 text-sm text-gray-500">
                            <span>Fixture #{fixture.id}</span>
                            {fixture.scheduled_date && (
                              <span className="ml-4">
                                {new Date(fixture.scheduled_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          {hasResult && (fixture as any).result?.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <strong>Notes:</strong> {(fixture as any).result.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {hasResult ? (
                        <>
                          {!isLocked && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditResult(fixture)}
                                disabled={isEditing}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLockResult((fixture as any).result?.id)}
                              >
                                <Lock className="h-4 w-4 mr-1" />
                                Lock
                              </Button>
                            </>
                          )}
                          {isLocked && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlockResult((fixture as any).result?.id)}
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Unlock
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleEditResult(fixture)}
                          disabled={isEditing}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Record Result
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsEntry;
