import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  createEvent, 
  listVenues
} from '../lib/api';
import { 
  CalendarIcon, 
  MapPinIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    registration_close_at: '',
    location: '',
    venue: '',
    capacity: 0,
    registration_fee_cents: 0,
    cover_image: null
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user || !['ADMIN', 'ORGANIZER'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadFormData();
  }, [user, navigate]);

  async function loadFormData() {
    try {
      const venuesData = await listVenues();
      setVenues(venuesData || []);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Event name is required';
    if (!formData.sport) newErrors.sport = 'Sport type is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.start_datetime) newErrors.start_datetime = 'Start date is required';
    if (!formData.end_datetime) newErrors.end_datetime = 'End date is required';
    if (!formData.registration_close_at) newErrors.registration_close_at = 'Registration deadline is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.capacity || formData.capacity <= 0) newErrors.capacity = 'Capacity must be greater than 0';
    
    // Date validation
    if (formData.start_datetime && formData.end_datetime && formData.start_datetime >= formData.end_datetime) {
      newErrors.end_datetime = 'End date must be after start date';
    }
    
    if (formData.registration_close_at && formData.start_datetime && formData.registration_close_at >= formData.start_datetime) {
      newErrors.registration_close_at = 'Registration deadline must be before event start';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Prepare data for submission
      const eventData = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        registration_fee_cents: parseInt(formData.registration_fee_cents) || 0,
        is_published: false, // Start as draft
        status: 'DRAFT'
      };

      // Remove cover_image from main data (will be handled separately)
      delete eventData.cover_image;

      const response = await createEvent(eventData);
      
      // Handle cover image upload if present
      if (formData.cover_image) {
        // TODO: Implement image upload
        console.log('Cover image upload to be implemented');
      }

      // Redirect to the created event
      navigate(`/events/${response.data.id}`);
      
    } catch (error) {
      console.error('Error creating event:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'Failed to create event. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const sportTypes = [
    'Soccer', 'Football', 'Basketball', 'Tennis', 'Swimming', 'Athletics',
    'Cricket', 'Baseball', 'Volleyball', 'Hockey', 'Golf', 'Rugby',
    'Badminton', 'Table Tennis', 'Boxing', 'Martial Arts', 'Cycling', 'Rowing'
  ];

  if (!user || !['ADMIN', 'ORGANIZER'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Create New Event
          </h1>
          <p className="text-xl text-gray-600">
            Set up your sports event with all the details participants need to know
          </p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Event Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
                  placeholder="e.g., Summer Soccer Championship"
                  required
                />
                
                <Input
                  label="Sport Type *"
                  name="sport"
                  value={formData.sport}
                  onChange={handleInputChange}
                  error={errors.sport}
                  required
                  as="select"
                >
                  <option value="">Select Sport</option>
                  {sportTypes.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </Input>
              </div>

              <Input
                label="Description *"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                error={errors.description}
                placeholder="Describe your event, rules, prizes, and what participants can expect..."
                as="textarea"
                rows={4}
                required
              />
            </div>

            {/* Dates & Schedule */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Dates & Schedule
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Start Date *"
                  name="start_datetime"
                  type="date"
                  value={formData.start_datetime}
                  onChange={handleInputChange}
                  error={errors.start_datetime}
                  required
                />
                
                <Input
                  label="End Date *"
                  name="end_datetime"
                  type="date"
                  value={formData.end_datetime}
                  onChange={handleInputChange}
                  error={errors.end_datetime}
                  required
                />
                
                <Input
                  label="Registration Deadline *"
                  name="registration_close_at"
                  type="date"
                  value={formData.registration_close_at}
                  onChange={handleInputChange}
                  error={errors.registration_close_at}
                  required
                />
              </div>
            </div>

            {/* Venue & Capacity */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Venue & Capacity
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Location *"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  error={errors.location}
                  placeholder="e.g., Main Stadium, City Center"
                  required
                />
                
                <Input
                  label="Venue (Optional)"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  error={errors.venue}
                  as="select"
                >
                  <option value="">Select Venue</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>{venue.name}</option>
                  ))}
                </Input>
                
                <Input
                  label="Maximum Capacity *"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  error={errors.capacity}
                  placeholder="e.g., 100"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* Registration & Pricing */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                Registration & Pricing
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Registration Fee (USD)"
                  name="registration_fee_cents"
                  type="number"
                  value={formData.registration_fee_cents}
                  onChange={handleInputChange}
                  error={errors.registration_fee_cents}
                  placeholder="0 for free events"
                  min="0"
                  step="0.01"
                />
                
                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="cover_image" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500 font-medium">
                            Upload a file
                          </span>
                          <span className="text-gray-500"> or drag and drop</span>
                        </label>
                        <input
                          id="cover_image"
                          name="cover_image"
                          type="file"
                          accept="image/*"
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/events')}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
