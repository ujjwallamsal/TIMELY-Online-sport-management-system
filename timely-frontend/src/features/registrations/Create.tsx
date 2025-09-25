import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useEvents, useCreateRegistration } from '../../api/queries';
import { useToast } from '../../contexts/ToastContext';

const RegistrationCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event');
  const { showSuccess, showError } = useToast();

  const { data: eventsData } = useEvents({
    page_size: 50,
  });

  const createRegistrationMutation = useCreateRegistration();

  const [selectedEvent, setSelectedEvent] = useState(eventId || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const events = eventsData?.results || [];
  const selectedEventData = events?.find(e => e.id.toString() === selectedEvent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent) {
      showError('Validation Error', 'Please select an event');
      return;
    }

    setIsSubmitting(true);

    try {
      await createRegistrationMutation.mutateAsync({
        event: parseInt(selectedEvent),
        notes: notes || null,
      });
      
      showSuccess('Registration Submitted', 'Your registration has been submitted for approval');
      navigate('/registrations/my');
    } catch (error) {
      showError('Registration Failed', 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedEvent;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/events')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Register for Event</h1>
              <p className="text-gray-600 mt-2">Sign up for sports events and competitions</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Registration</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Event Selection */}
                <div>
                  <label className="form-label">Select Event</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Choose an event...</option>
                    {events
                      .filter(event => event.status === 'PUBLISHED')
                      .map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name} - {new Date(event.start_datetime).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Selected Event Details */}
                {selectedEventData && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Event Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Date & Time</p>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedEventData.start_datetime).toLocaleDateString()} at{' '}
                            {new Date(selectedEventData.start_datetime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Venue</p>
                          <p className="text-sm text-gray-600">
                            {selectedEventData.venue_name || selectedEventData.location || 'TBD'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Sport</p>
                          <p className="text-sm text-gray-600">
                            {selectedEventData.sport_name || `Sport ${selectedEventData.sport}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Registration Fee</p>
                          <p className="text-sm text-gray-600">
                            {selectedEventData.fee_cents ? `$${(selectedEventData.fee_cents / 100).toFixed(2)}` : 'Free'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedEventData.description && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">Description</p>
                        <p className="text-sm text-gray-600">{selectedEventData.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="form-label">Additional Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Any additional information you'd like to include..."
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
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submit Registration
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Registration Info */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Process</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Select an event you want to participate in</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Review event details and requirements</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Submit your registration for approval</p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p>Wait for organizer approval</p>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Notes</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Registration is subject to organizer approval</p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>You will be notified once your registration is approved</p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Make sure you meet all event requirements</p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Contact the organizer if you have questions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationCreate;