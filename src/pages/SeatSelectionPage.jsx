import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/Footer';
import VenueSeatingChart from '../components/VenueSeatingChart';
import { fetchEventById } from '../services/eventService';
import { fetchSeatMapData, holdSeat, releaseSeats, cleanupExpiredReservations } from '../services/seatMapService';
import { getSafeStatus } from '../constants/seatStatus';

const { FiArrowLeft, FiCalendar, FiMapPin, FiClock, FiAlertCircle } = FiIcons;

const SeatSelectionPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [seatStatuses, setSeatStatuses] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isReserving, setIsReserving] = useState(false);

  // Load seat map data
  useEffect(() => {
    const loadSeatMap = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Loading seat map for event:', id);
        const data = await fetchSeatMapData(id);
        console.log('Seat map data loaded:', data);
        
        if (!data.event) {
          throw new Error('Event data is missing');
        }
        
        setEvent(data.event);
        setVenue(data.venue);
        setSeatStatuses(data.seatStatuses || {});
        
        // Clean up any expired reservations
        cleanupExpiredReservations().catch(console.error);
      } catch (err) {
        console.error('Error loading seat map:', err);
        setError(err.message || 'Failed to load seat map data');
      } finally {
        setLoading(false);
      }
    };
    
    loadSeatMap();
  }, [id]);

  // Handle seat selection
  const handleSeatSelect = async (seat) => {
    const isSelected = selectedSeats.find(s => s.id === seat.id);
    
    if (isSelected) {
      // Deselect seat
      try {
        await releaseSeats(id, [seat.id]);
        setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
      } catch (error) {
        console.error('Error releasing seat:', error);
      }
    } else {
      // Select seat (limit to 8 seats)
      if (selectedSeats.length >= 8) {
        alert('You can select maximum 8 seats at once.');
        return;
      }
      
      try {
        const success = await holdSeat(id, seat.id);
        if (success) {
          // Get category and price information
          let categoryName = 'Standard';
          let price = 45;
          
          // Try to get category name from venue
          if (seat.categoryId && venue?.canvas_data?.categories) {
            const category = venue.canvas_data.categories[seat.categoryId];
            if (category) {
              categoryName = category.name || categoryName;
            }
          }
          
          // Try to get price from event price_book
          if (seat.categoryId && event?.price_book) {
            price = event.price_book[seat.categoryId] || price;
          }
          
          setSelectedSeats(prev => [
            ...prev,
            { ...seat, categoryName, price }
          ]);
        } else {
          alert('This seat is no longer available.');
        }
      } catch (error) {
        console.error('Error selecting seat:', error);
        alert('Failed to select seat. Please try again.');
      }
    }
  };

  // Calculate total price
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 45), 0);
  const serviceFee = Math.round(totalPrice * 0.1); // 10% service fee
  const grandTotal = totalPrice + serviceFee;

  // Handle checkout
  const handleProceedToCheckout = async () => {
    if (selectedSeats.length === 0) return;
    
    setIsReserving(true);
    try {
      // Navigate to checkout with selected seats
      navigate(`/checkout/${id}`, { state: { selectedSeats, totalPrice: grandTotal } });
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      alert('Failed to proceed to checkout. Please try again.');
    } finally {
      setIsReserving(false);
    }
  };

  // Handle general admission (no venue)
  const handleGeneralAdmissionCheckout = () => {
    navigate(`/checkout/${id}`);
  };

  // Format date for display
  const formatEventDate = (eventDate, eventDateISO) => {
    try {
      const date = new Date(eventDateISO || eventDate);
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[date.getDay()];
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const year = date.getFullYear();
      
      return `${day} ${month} • ${dayName} • ${time} • ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return eventDate || 'Date not available';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        <NavBar />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading seat map...</h1>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        <NavBar />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <SafeIcon icon={FiAlertCircle} className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-6">
              {error || 'Failed to load seat map data. Please try again.'}
            </p>
            <Link to="/concerts" className="text-primary-400 hover:text-primary-300">
              Back to concerts
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // If no venue is configured, show general admission interface
  if (!venue || !venue.canvas_data || !venue.canvas_data.elements || venue.canvas_data.elements.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        <NavBar />
        <div className="pt-24 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6"
            >
              <Link to={`/concert/${id}`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
                <SafeIcon icon={FiArrowLeft} className="w-5 h-5 mr-2" />
                Back to event details
              </Link>
            </motion.div>
            
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{event.title}</h1>
              <p className="text-gray-400">{event.date} • {event.location}</p>
            </div>
            
            <div className="bg-zinc-800 rounded-lg p-8 max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-6">General Admission</h2>
              <p className="text-gray-300 mb-6">
                This event has general admission seating. No specific seats are assigned.
              </p>
              
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Ticket Price</h3>
                <div className="flex justify-between items-center p-4 bg-zinc-700 rounded-lg">
                  <span>General Admission</span>
                  <span className="text-xl font-bold text-primary-400">
                    €{event.price_book?.GENERAL || 45}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleGeneralAdmissionCheckout}
                className="w-full bg-primary-400 hover:bg-primary-500 text-black font-medium py-3 rounded-lg transition-colors"
              >
                Continue to Checkout
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Get categories for legend
  const categories = venue?.canvas_data?.categories || {};

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <NavBar />
      <div className="pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link to={`/concert/${id}`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
              <SafeIcon icon={FiArrowLeft} className="w-5 h-5 mr-2" />
              Back to event details
            </Link>
          </motion.div>

          {/* Event Info Header - New Structure */}
          <div className="mb-8">
            <div className="flex w-full">
              {/* Text Column */}
              <div className="flex flex-col justify-start gap-0.5">
                <span className="text-white text-sm font-bold leading-[18px]">
                  {event.title}
                </span>
                <span className="text-gray-400 text-xs font-medium leading-4">
                  {formatEventDate(event.date, event.event_date)}
                </span>
                <span className="text-gray-400 text-xs font-medium leading-4">
                  {venue?.name ? `${venue.name}, ${event.location}` : event.location}
                </span>
                
                {/* Categories with pricing */}
                {Object.keys(categories).length > 0 && (
                  <div className="inline-flex gap-2.5 mt-1 items-end flex-wrap">
                    {Object.entries(categories).map(([categoryId, category]) => {
                      const price = event.price_book?.[categoryId] || 45;
                      return (
                        <span
                          key={categoryId}
                          className="bg-zinc-700/50 text-gray-400 rounded-md px-2 py-0.5 text-xs font-medium inline-flex items-center whitespace-nowrap"
                        >
                          <span
                            className="inline-block w-3 h-3 rounded-full mr-1.5"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}&nbsp;€{price}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Seating Chart */}
            <div className="lg:col-span-3">
              <div className="rounded-lg overflow-hidden">
                <VenueSeatingChart
                  venue={venue}
                  eventId={id}
                  seatStatuses={seatStatuses}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                />
              </div>
            </div>

            {/* Selection Summary */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-800 rounded-lg p-6 sticky top-28">
                <h2 className="text-xl font-semibold mb-4">Your Selection</h2>
                
                {selectedSeats.length === 0 ? (
                  <p className="text-gray-400 mb-4">No seats selected</p>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div className="max-h-48 overflow-auto space-y-2">
                      {selectedSeats.map(seat => (
                        <div
                          key={seat.id}
                          className="flex justify-between items-center py-2 px-3 bg-zinc-700 rounded-lg"
                        >
                          <div className="text-sm">
                            <div className="font-medium">
                              {seat.number || `Seat ${seat.id}`}
                            </div>
                            <div className="text-gray-400">
                              {seat.categoryName}
                            </div>
                          </div>
                          <div className="font-medium">
                            €{seat.price}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-zinc-700 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal ({selectedSeats.length} seats)</span>
                        <span>€{totalPrice}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Service Fee</span>
                        <span>€{serviceFee}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-zinc-600">
                        <span>Total</span>
                        <span className="text-primary-400">€{grandTotal}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleProceedToCheckout}
                  disabled={selectedSeats.length === 0 || isReserving}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    selectedSeats.length > 0 && !isReserving
                      ? 'bg-primary-400 hover:bg-primary-500 text-black'
                      : 'bg-zinc-700 cursor-not-allowed text-zinc-500'
                  }`}
                >
                  {isReserving ? 'Processing...' : 'Proceed to Checkout'}
                </button>
                
                {selectedSeats.length > 0 && (
                  <div className="mt-4 text-xs text-gray-400 text-center">
                    Selected seats will be held for 10 minutes
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SeatSelectionPage;