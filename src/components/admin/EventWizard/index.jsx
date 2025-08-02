import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import EventBasicInfo from './EventBasicInfo';
import EventVenueSelection from './EventVenueSelection';
import EventPricing from './EventPricing';

const {FiCheck, FiArrowRight, FiArrowLeft, FiAlertCircle} = FiIcons;

const EventWizard = ({onSave, onCancel, saving = false, eventToEdit = null}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: 'concert',
    date: '',
    time: '20:00',
    location: '',
    artist: '',
    genre: '',
    image: '',
    venue_id: null,
    priceBook: {}
  });
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // If editing an existing event, initialize form with event data
  useEffect(() => {
    if (eventToEdit) {
      const eventDate = eventToEdit.event_date ? new Date(eventToEdit.event_date) : new Date();
      setEventData({
        title: eventToEdit.title || '',
        description: eventToEdit.description || '',
        category: eventToEdit.category || 'concert',
        date: eventDate.toISOString().split('T')[0],
        time: eventDate.toTimeString().slice(0, 5),
        location: eventToEdit.location || '',
        artist: eventToEdit.artist || '',
        genre: eventToEdit.genre || '',
        image: eventToEdit.image || '',
        venue_id: eventToEdit.venue_id || null,
        priceBook: eventToEdit.price_book || {}
      });

      // If venue exists, need to fetch it to set selectedVenue
      if (eventToEdit.venue) {
        setSelectedVenue(eventToEdit.venue);
      }
    }
  }, [eventToEdit]);

  const steps = [
    {number: 1, title: 'Basic Info', component: 'basic'},
    {number: 2, title: 'Venue', component: 'venue'},
    {number: 3, title: 'Pricing', component: 'pricing'},
    {number: 4, title: 'Review', component: 'review'}
  ];

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!eventData.title.trim()) newErrors.title = 'Title is required';
        if (!eventData.description.trim()) newErrors.description = 'Description is required';
        if (!eventData.date) newErrors.date = 'Date is required';
        if (!eventData.location.trim()) newErrors.location = 'Location is required';
        break;
      case 2:
        // Venue selection is optional
        break;
      case 3:
        if (selectedVenue) {
          // Get venue categories from canvas_data
          const venueCategories = Object.keys(selectedVenue.canvas_data?.categories || {});
          
          // Check that all venue categories have prices > 0
          for (const categoryId of venueCategories) {
            if (!eventData.priceBook[categoryId] || eventData.priceBook[categoryId] <= 0) {
              newErrors[`price_${categoryId}`] = `Price for ${categoryId} is required and must be > 0`;
            }
          }
        } else {
          // General admission
          if (!eventData.priceBook.GENERAL || eventData.priceBook.GENERAL <= 0) {
            newErrors.price_GENERAL = 'General admission price is required and must be > 0';
          }
        }
        break;
      case 4:
        // Final validation - same as step 3
        if (selectedVenue) {
          const venueCategories = Object.keys(selectedVenue.canvas_data?.categories || {});
          for (const categoryId of venueCategories) {
            if (!eventData.priceBook[categoryId] || eventData.priceBook[categoryId] <= 0) {
              newErrors[`price_${categoryId}`] = `Price for ${categoryId} is required`;
            }
          }
        } else {
          if (!eventData.priceBook.GENERAL || eventData.priceBook.GENERAL <= 0) {
            newErrors.price_GENERAL = 'General admission price is required';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      setServerError('');
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setServerError('');
  };

  const handleDataChange = (newData) => {
    setEventData(prev => ({...prev, ...newData}));
    setErrors({});
    setServerError('');
  };

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setEventData(prev => ({
      ...prev,
      venue_id: venue?.id || null,
      priceBook: venue ? generateDefaultPriceBook(venue.canvas_data?.categories) : {GENERAL: 45}
    }));
  };

  const generateDefaultPriceBook = (categories) => {
    const priceBook = {};
    Object.keys(categories || {}).forEach(categoryId => {
      // Set default prices based on category name
      if (categoryId.includes('VIP')) {
        priceBook[categoryId] = 85;
      } else if (categoryId.includes('PREMIUM')) {
        priceBook[categoryId] = 120;
      } else if (categoryId.includes('BALC')) {
        priceBook[categoryId] = 65;
      } else {
        priceBook[categoryId] = 45;
      }
    });
    return priceBook;
  };

  const handleFinish = async () => {
    if (!validateStep(4)) {
      return;
    }

    try {
      setServerError('');
      // Prepare final event data
      const finalEventData = {
        ...eventData,
        event_date: new Date(`${eventData.date}T${eventData.time}`).toISOString(),
        date: new Date(`${eventData.date}T${eventData.time}`).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }),
        // Use price_book directly for API
        price_book: eventData.priceBook
      };
      
      console.log('Final event data:', finalEventData);
      const result = await onSave(finalEventData);
      if (result && result.id) {
        // Navigate to event dashboard on success
        navigate(`/admin/events/${result.id}/dashboard`);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      if (error.status === 422 && error.details) {
        // Validation errors from server
        setServerError(error.details.join(','));
      } else {
        setServerError(error.message || 'Failed to create event. Please try again.');
      }
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <EventBasicInfo
            data={eventData}
            onChange={handleDataChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <EventVenueSelection
            selectedVenue={selectedVenue}
            onVenueSelect={handleVenueSelect}
          />
        );
      case 3:
        return (
          <EventPricing
            venue={selectedVenue}
            priceBook={eventData.priceBook}
            onChange={(priceBook) => handleDataChange({priceBook})}
            errors={errors}
          />
        );
      case 4:
        return (
          <EventReview
            eventData={eventData}
            venue={selectedVenue}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return eventData.title.trim() && eventData.description.trim() && eventData.date && eventData.location.trim();
      case 2:
        return true; // Venue selection is optional
      case 3:
        if (selectedVenue) {
          const venueCategories = Object.keys(selectedVenue.canvas_data?.categories || {});
          return venueCategories.every(categoryId => 
            eventData.priceBook[categoryId] && eventData.priceBook[categoryId] > 0
          );
        } else {
          return eventData.priceBook.GENERAL && eventData.priceBook.GENERAL > 0;
        }
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{opacity: 0, scale: 0.9}}
        animate={{opacity: 1, scale: 1}}
        className="bg-zinc-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header with Steps */}
        <div className="border-b border-zinc-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {eventToEdit ? 'Edit Event' : 'Create New Event'}
          </h2>
          {/* Step Indicator */}
          <div className="flex items-center space-x-4">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.number ? 'bg-primary-400 text-black' : 'bg-zinc-700 text-gray-400'
                  }`}
                >
                  {currentStep > step.number ? (
                    <SafeIcon icon={FiCheck} className="w-4 h-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    currentStep >= step.number ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
                {step.number < steps.length && (
                  <div className="w-8 h-px bg-zinc-600 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mx-6 mt-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center">
            <SafeIcon icon={FiAlertCircle} className="w-5 h-5 mr-2 flex-shrink-0" />
            <div>
              <strong>Validation Error:</strong> {serverError}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{opacity: 0, x: 20}}
              animate={{opacity: 1, x: 0}}
              exit={{opacity: 0, x: -20}}
              transition={{duration: 0.2}}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer with Navigation */}
        <div className="border-t border-zinc-700 p-6 flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-600 hover:border-zinc-500 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={handlePrev}
                className="flex items-center px-4 py-2 border border-zinc-600 hover:border-zinc-500 text-white rounded-lg transition-colors"
              >
                <SafeIcon icon={FiArrowLeft} className="w-4 h-4 mr-2" />
                Previous
              </button>
            )}
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  canProceed()
                    ? 'bg-primary-400 hover:bg-primary-500 text-black'
                    : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                }`}
              >
                Next
                <SafeIcon icon={FiArrowRight} className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving || !canProceed()}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  saving || !canProceed()
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-primary-400 hover:bg-primary-500 text-black'
                }`}
              >
                {saving ? 'Saving...' : eventToEdit ? 'Update Event' : 'Create Event'}
                <SafeIcon icon={FiCheck} className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Event Review Component
const EventReview = ({eventData, venue, errors}) => {
  const formatDate = (dateStr, timeStr) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalCategories = () => {
    return venue ? Object.keys(venue.canvas_data?.categories || {}).length : 1;
  };

  const getPriceRange = () => {
    const prices = Object.values(eventData.priceBook).filter(p => p > 0);
    if (prices.length === 0) return '€0';
    if (prices.length === 1) return `€${prices[0]}`;
    return `€${Math.min(...prices)} - €${Math.max(...prices)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Review & Create Event</h3>
        <p className="text-gray-400 mb-6">
          Please review all information before creating the event.
        </p>
      </div>

      {/* Event Summary */}
      <div className="bg-zinc-700/30 rounded-lg p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Event Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Title:</span>
              <span className="text-white font-medium ml-2">{eventData.title}</span>
            </div>
            <div>
              <span className="text-gray-400">Category:</span>
              <span className="text-white font-medium ml-2 capitalize">{eventData.category}</span>
            </div>
            <div>
              <span className="text-gray-400">Date & Time:</span>
              <span className="text-white font-medium ml-2">
                {formatDate(eventData.date, eventData.time)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Location:</span>
              <span className="text-white font-medium ml-2">{eventData.location}</span>
            </div>
            {eventData.artist && (
              <div>
                <span className="text-gray-400">Artist:</span>
                <span className="text-white font-medium ml-2">{eventData.artist}</span>
              </div>
            )}
            {eventData.genre && (
              <div>
                <span className="text-gray-400">Genre:</span>
                <span className="text-white font-medium ml-2">{eventData.genre}</span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <span className="text-gray-400">Description:</span>
            <p className="text-white mt-1">{eventData.description}</p>
          </div>
        </div>

        {/* Venue Info */}
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Venue</h4>
          {venue ? (
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-400">Venue:</span>
                <span className="text-white font-medium ml-2">{venue.name}</span>
              </div>
              <div>
                <span className="text-gray-400">Categories:</span>
                <span className="text-white font-medium ml-2">{getTotalCategories()}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <span className="text-gray-400">Type:</span>
              <span className="text-white font-medium ml-2">General Admission</span>
            </div>
          )}
        </div>

        {/* Pricing Info */}
        <div>
          <h4 className="text-lg font-medium text-white mb-3">Pricing</h4>
          <div className="space-y-2">
            {venue ? (
              Object.entries(venue.canvas_data?.categories || {}).map(([categoryId, category]) => {
                const price = eventData.priceBook[categoryId];
                const hasError = !price || price <= 0;
                return (
                  <div
                    key={categoryId}
                    className={`flex items-center justify-between p-2 rounded ${
                      hasError ? 'bg-red-500/20 border border-red-500/50' : 'bg-zinc-700/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{backgroundColor: category.color}}
                      />
                      <span className="text-white font-medium">{categoryId}</span>
                      <span className="text-gray-400 text-sm ml-2">({category.name})</span>
                    </div>
                    <div className={`font-medium ${hasError ? 'text-red-400' : 'text-primary-400'}`}>
                      {hasError ? 'Missing Price!' : `€${price}`}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-between p-2 bg-zinc-700/50 rounded">
                <span className="text-white font-medium">General Admission</span>
                <span className="text-primary-400 font-medium">€{eventData.priceBook.GENERAL || 0}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-2 border-t border-zinc-600">
              <span className="text-gray-400">Price Range:</span>
              <span className="text-primary-400 font-medium">{getPriceRange()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Please fix the following issues:</h4>
          <ul className="text-sm space-y-1">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>• {message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Indicator */}
      {Object.keys(errors).length === 0 && (
        <div className="bg-green-500/20 border border-green-500 text-green-200 p-4 rounded-lg">
          <div className="flex items-center">
            <SafeIcon icon={FiCheck} className="w-5 h-5 mr-2" />
            <span className="font-medium">Ready to create event!</span>
          </div>
          <p className="text-sm mt-1">All required information is complete.</p>
        </div>
      )}
    </div>
  );
};

export default EventWizard;