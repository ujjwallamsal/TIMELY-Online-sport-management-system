import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { eventCreateSchema, type EventCreateData } from '../../schemas/events';
import { useCreateEvent, useSports, useVenues } from '../../api/queries';
import { useToast } from '../../contexts/ToastContext';
import { Form, FormGroup, FormRow, FormActions, Input, Textarea, Select, Button } from '../../components/Form';

const EventCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const createEventMutation = useCreateEvent();
  const { data: sports = [] } = useSports();
  const { data: venues = [] } = useVenues();

  const form = useForm<EventCreateData>({
    initialValues: {
      name: '',
      description: '',
      sport: 0,
      venue: 0,
      start_datetime: '',
      end_datetime: '',
      fee_cents: undefined,
      capacity: undefined,
      visibility: 'PUBLIC',
      location: '',
      registration_open_at: '',
      registration_close_at: '',
    },
    validationSchema: eventCreateSchema,
    onSubmit: async (values) => {
      try {
        await createEventMutation.mutateAsync(values);
        showSuccess('Event Created', 'The event has been created successfully.');
        navigate('/events');
      } catch (error) {
        showError('Creation Failed', 'Failed to create event. Please try again.');
      }
    },
  });

  const sportOptions = (sports as any)?.results?.map((sport: any) => ({
    value: sport.id.toString(),
    label: sport.name,
  })) || [];

  const venueOptions = (venues as any)?.results?.map((venue: any) => ({
    value: venue.id.toString(),
    label: venue.name,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Event</h1>
          
          <Form onSubmit={form.handleSubmit}>
            <FormGroup>
              <Input
                label="Event Name"
                name="name"
                value={form.values.name}
                onChange={(e) => form.setValue('name', e.target.value)}
                onBlur={() => form.validateField('name')}
                error={form.errors.name}
                placeholder="Enter event name"
                required
              />
            </FormGroup>

            <FormGroup>
              <Textarea
                label="Description"
                name="description"
                value={form.values.description}
                onChange={(e) => form.setValue('description', e.target.value)}
                onBlur={() => form.validateField('description')}
                error={form.errors.description}
                placeholder="Enter event description"
                rows={4}
                required
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Select
                  label="Sport"
                  name="sport"
                  value={form.values.sport.toString()}
                  onChange={(e) => form.setValue('sport', parseInt(e.target.value))}
                  onBlur={() => form.validateField('sport')}
                  error={form.errors.sport}
                  options={sportOptions}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Select
                  label="Venue"
                  name="venue"
                  value={form.values.venue.toString()}
                  onChange={(e) => form.setValue('venue', parseInt(e.target.value))}
                  onBlur={() => form.validateField('venue')}
                  error={form.errors.venue}
                  options={venueOptions}
                  required
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Input
                  label="Start Date & Time"
                  name="start_datetime"
                  type="datetime-local"
                  value={form.values.start_datetime}
                  onChange={(e) => form.setValue('start_datetime', e.target.value)}
                  onBlur={() => form.validateField('start_datetime')}
                  error={form.errors.start_datetime}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Input
                  label="End Date & Time"
                  name="end_datetime"
                  type="datetime-local"
                  value={form.values.end_datetime}
                  onChange={(e) => form.setValue('end_datetime', e.target.value)}
                  onBlur={() => form.validateField('end_datetime')}
                  error={form.errors.end_datetime}
                  required
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Input
                  label="Registration Fee (USD)"
                  name="fee_cents"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.values.fee_cents ? (form.values.fee_cents / 100).toFixed(2) : ''}
                  onChange={(e) => form.setValue('fee_cents', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined)}
                  onBlur={() => form.validateField('fee_cents')}
                  error={form.errors.fee_cents}
                  placeholder="0.00"
                />
              </FormGroup>

              <FormGroup>
                <Input
                  label="Capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.values.capacity || ''}
                  onChange={(e) => form.setValue('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                  onBlur={() => form.validateField('capacity')}
                  error={form.errors.capacity}
                  placeholder="No limit"
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Select
                  label="Visibility"
                  name="visibility"
                  value={form.values.visibility}
                  onChange={(e) => form.setValue('visibility', e.target.value as 'PUBLIC' | 'PRIVATE')}
                  onBlur={() => form.validateField('visibility')}
                  error={form.errors.visibility}
                  options={[
                    { value: 'PUBLIC', label: 'Public' },
                    { value: 'PRIVATE', label: 'Private' },
                  ]}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Input
                  label="Location (Optional)"
                  name="location"
                  value={form.values.location}
                  onChange={(e) => form.setValue('location', e.target.value)}
                  onBlur={() => form.validateField('location')}
                  error={form.errors.location}
                  placeholder="Additional location details"
                />
              </FormGroup>
            </FormRow>

            <FormActions>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/events')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={form.isSubmitting}
                disabled={!form.isValid || form.isSubmitting}
              >
                Create Event
              </Button>
            </FormActions>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EventCreate;
