import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Plus,
  Clock,
  Users,
  MapPin,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api/client';
import { ENDPOINTS } from '../../api/ENDPOINTS';
import { useToast } from '../../contexts/ToastContext';
import { Form, FormGroup, FormRow, FormActions, Input, Button } from '../../components/Form';
import { z } from 'zod';

interface VenueSlot {
  id: number;
  venue: number;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  is_available: boolean;
  venue_name?: string;
}

interface Venue {
  id: number;
  name: string;
  location: string;
  capacity: number;
}

interface SlotFormData {
  venue: number;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
}

const VenueSlots: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [slots, setSlots] = useState<VenueSlot[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SlotFormData>({
    initialValues: {
      venue: selectedVenue || 0,
      date: '',
      start_time: '',
      end_time: '',
      capacity: 0,
    },
    validationSchema: z.object({
      venue: z.number().min(1, 'Please select a venue'),
      date: z.string().min(1, 'Date is required'),
      start_time: z.string().min(1, 'Start time is required'),
      end_time: z.string().min(1, 'End time is required'),
      capacity: z.number().min(1, 'Capacity must be at least 1'),
    }),
    onSubmit: async () => {
      setIsSubmitting(true);
      try {
        await api.post(ENDPOINTS.venueSlots(form.values.venue), form.values);
        showSuccess('Slot Created', 'Venue slot has been successfully created.');
        setShowForm(false);
        form.reset();
        fetchSlots();
      } catch (error) {
        console.error('Create slot error:', error);
        showError('Creation Failed', 'Failed to create venue slot. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Fetch venues
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await api.get(ENDPOINTS.venues);
        setVenues(response.data.results || []);
        if (response.data.results && response.data.results.length > 0) {
          setSelectedVenue(response.data.results[0].id);
          form.setValue('venue', response.data.results[0].id);
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
        setError('Failed to load venues');
      }
    };

    fetchVenues();
  }, []);

  // Fetch slots
  const fetchSlots = async () => {
    if (!selectedVenue) return;
    
    try {
      setIsLoading(true);
      const response = await api.get(ENDPOINTS.venueSlots(selectedVenue));
      setSlots(response.data.results || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError('Failed to load venue slots');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedVenue]);

  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;

    try {
      await api.delete(`${ENDPOINTS.venueSlots(selectedVenue!)}${slotId}/`);
      showSuccess('Slot Deleted', 'Venue slot has been successfully deleted.');
      fetchSlots();
    } catch (error) {
      console.error('Delete slot error:', error);
      showError('Deletion Failed', 'Failed to delete venue slot. Please try again.');
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Venue Slots</h1>
              <p className="text-gray-600 mt-2">Manage venue availability and capacity</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </button>
          </div>
        </div>

        {/* Venue Selector */}
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <label className="form-label">Select Venue</label>
              <select
                value={selectedVenue || ''}
                onChange={(e) => setSelectedVenue(parseInt(e.target.value))}
                className="form-input"
              >
                <option value="">Choose a venue...</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add Slot Form */}
        {showForm && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Venue Slot</h3>
            <Form onSubmit={form.handleSubmit}>
              <FormRow>
                <FormGroup>
                  <label className="form-label">Venue</label>
                  <select
                    value={form.values.venue}
                    onChange={(e) => form.setValue('venue', parseInt(e.target.value))}
                    className="form-input"
                  >
                    <option value={0}>Select venue...</option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} - {venue.location}
                      </option>
                    ))}
                  </select>
                  {form.errors.venue && (
                    <p className="text-red-500 text-sm mt-1">{form.errors.venue}</p>
                  )}
                </FormGroup>
                <FormGroup>
                  <Input
                    label="Date"
                    name="date"
                    type="date"
                    value={form.values.date}
                    onChange={(e) => form.setValue('date', e.target.value)}
                    error={form.errors.date}
                    required
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Input
                    label="Start Time"
                    name="start_time"
                    type="time"
                    value={form.values.start_time}
                    onChange={(e) => form.setValue('start_time', e.target.value)}
                    error={form.errors.start_time}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Input
                    label="End Time"
                    name="end_time"
                    type="time"
                    value={form.values.end_time}
                    onChange={(e) => form.setValue('end_time', e.target.value)}
                    error={form.errors.end_time}
                    required
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Input
                  label="Capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.values.capacity}
                  onChange={(e) => form.setValue('capacity', parseInt(e.target.value) || 0)}
                  error={form.errors.capacity}
                  required
                />
              </FormGroup>

              <FormActions>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!form.isValid || isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Slot'}
                </Button>
              </FormActions>
            </Form>
          </div>
        )}

        {/* Slots List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Slots
            {selectedVenue && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                for {venues.find(v => v.id === selectedVenue)?.name}
              </span>
            )}
          </h3>

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
          ) : slots.length > 0 ? (
            <div className="space-y-4">
              {slots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {formatDate(slot.date)}
                      </h4>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {slot.capacity} capacity
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      slot.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {slot.is_available ? 'Available' : 'Unavailable'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Slot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No slots found</h3>
              <p className="text-gray-500 mb-4">
                {selectedVenue 
                  ? 'No slots have been created for this venue yet'
                  : 'Please select a venue to view its slots'
                }
              </p>
              {selectedVenue && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Slot
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueSlots;
