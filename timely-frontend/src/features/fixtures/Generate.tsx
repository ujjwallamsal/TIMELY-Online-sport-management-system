import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, useGenerateFixtures } from '../../api/queries';
import { useToast } from '../../contexts/ToastContext';
import { Form, FormGroup, FormActions, Select, Button } from '../../components/Form';

const FixtureGenerate: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { data: events } = useEvents({ status: 'published' });
  const generateFixturesMutation = useGenerateFixtures();
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const eventOptions = events?.results?.map(event => ({
    value: event.id.toString(),
    label: event.name,
  })) || [];

  const handleGenerate = async () => {
    if (!selectedEventId) {
      showError('Selection Required', 'Please select an event to generate fixtures for.');
      return;
    }

    try {
      await generateFixturesMutation.mutateAsync(parseInt(selectedEventId));
      showSuccess('Fixtures Generated', 'Fixtures have been generated successfully.');
      navigate('/fixtures');
    } catch (error) {
      showError('Generation Failed', 'Failed to generate fixtures. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Generate Fixtures</h1>
          <p className="text-gray-600 mb-6">
            Select an event to automatically generate fixtures based on registered participants.
          </p>
          
          <Form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
            <FormGroup>
              <Select
                label="Select Event"
                name="event"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                options={eventOptions}
                required
              />
            </FormGroup>

            <FormActions>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/fixtures')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={generateFixturesMutation.isPending}
                disabled={!selectedEventId || generateFixturesMutation.isPending}
              >
                Generate Fixtures
              </Button>
            </FormActions>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default FixtureGenerate;
