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
import { fetchVenueById, getSeatAvailability, reserveSeats, cleanupExpiredReservations } from '../services/venueService';

const { FiArrowLeft, FiUsers, FiMapPin, FiCalendar, FiClock } = FiIcons;

const SeatSelectionWithVenue = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatAvailability, setSeatAvailability] = useState({
    seats: [],
    reservations: [],
    purchases: []
  });
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    loadEventAndVenue();
    // Cleanup expired reservations periodically
    const interval = setInterval(() => {
      cleanupExpiredReservations();
      loadSeatAvailability();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [id]);

  const loadEventAndVenue = async () => {
    setLoading(true);
    try {
      const eventData = await fetchEventById(id);
      if (eventData) {
        setEvent(eventData);
        
        if (eventData.venue_id) {
          const venueData = await fetchVenueById(eventData.venue_id);
          setVenue(venueData);
        }
        
        await loadSeatAvailability();
      }
    } catch (error) {
      console.error('Error loading event and venue:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSeatAvailability = async () => {
    try {
      const availability = await getSeatAvailability(id);
      setSeatAvailability(availability);
    } catch (error) {
      console.error('Error loading seat availability:', error);
    }
  };

  const handleSeatSelect = (seat) => {
    const isSelected = selectedSeats.find(s => s.id === seat.id);
    
    if (isSelected) {
      // Deselect seat
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
    } else {
      // Select seat (limit to 8 seats)
      if (selectedSeats.length < 8) {
        const venueSeat = seatAvailability.seats.find(s => s.id === seat.id);
        setSelectedSeats(prev => [...prev, {
          ...seat,
          price: venueSeat?.price || 45
        }]);
      } else {
        alert('You can select maximum 8 seats at once.');
      }
    }
  };

  const handleProceedToCheckout = async () => {
    if (selectedSeats.length === 0) return;
    
    setIsReserving(true);
    try {
      // Reserve seats for 10 minutes
      const customerEmail = 'temp@example.com'; // In real app, get from user or generate temp ID
      const seatIds = selectedSeats.map(s => s.id);
      
      const reservations = await reserveSeats(id, seatIds, customerEmail);
      
      if (reservations.length > 0) {
        // Navigate to checkout with selected seats
        navigate(`/checkout/${id}`, {
          state: {
            selectedSeats,
            reservationIds: reservations.map(r => r.id)
          }
        });
      } else {
        alert('Failed to reserve seats. Please try again.');
      }
    } catch (error) {
      console.error('Error reserving seats:', error);
      alert('Failed to reserve seats. Please try again.');
    } finally {
      setIsReserving(false);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 45), 0);
  const serviceFee = Math.round(totalPrice * 0.1); // 10% service fee
  const grandTotal = totalPrice + serviceFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
        <NavBar />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading venue...</h1>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
        <NavBar />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event not found</h1>
            <Link to="/concerts" className="text-primary-400 hover:text-primary-300">
              Back to concerts
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!venue) {
    // Fallback to basic seat selection if no venue is configured
    return (
      <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
        <NavBar />
        <div className="pt-24 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Link to={`/concert/${id}`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors">
                <SafeIcon icon={FiArrowLeft} className="w-5 h-5 mr-2" />
                Back to event details
              </Link>
            </motion.div>

            <h1 className="text-2xl font-bold mb-4">Seat Selection Not Available</h1>
            <p className="text-gray-400 mb-8">
              This event doesn't have a configured venue layout. Please contact support or use general admission.
            </p>

            <div className="bg-zinc-800 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-4">General Admission</h3>
              <div className="text-3xl font-bold text-primary-400 mb-4">€45</div>
              <button
                onClick={() => navigate(`/checkout/${id}`)}
                className="w-full bg-primary-400 hover:bg-primary-500 text-black font-medium py-3 rounded-lg transition-colors"
              >
                Buy General Admission
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
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

          {/* Event Info Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-400">
              <div className="flex items-center">
                <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-1" />
                {event.date}
              </div>
              <div className="flex items-center">
                <SafeIcon icon={FiMapPin} className="w-4 h-4 mr-1" />
                {event.location}
              </div>
              <div className="flex items-center">
                <SafeIcon icon={FiClock} className="w-4 h-4 mr-1" />
                Doors open at 8:00 PM
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Seating Chart */}
            <div className="lg:col-span-3">
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Select Your Seats</h2>
                  <div className="text-sm text-gray-400">
                    {venue.name}
                  </div>
                </div>
                
                <div className="h-[600px]">
                  <VenueSeatingChart
                    venue={venue}
                    eventId={id}
                    reservedSeats={seatAvailability.reservations}
                    purchasedSeats={seatAvailability.purchases}
                    selectedSeats={selectedSeats}
                    onSeatSelect={handleSeatSelect}
                  />
                </div>
              </div>
            </div>

            {/* Selection Summary */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-800 rounded-lg p-6 sticky top-28">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <SafeIcon icon={FiUsers} className="mr-2" />
                  Your Selection
                </h2>

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
                            <div className="font-medium">{seat.number || `Seat ${seat.id}`}</div>
                            <div className="text-gray-400">{seat.section} - Row {seat.row}</div>
                          </div>
                          <div className="font-medium">€{seat.price || 45}</div>
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
                  {isReserving ? 'Reserving Seats...' : 'Proceed to Checkout'}
                </button>

                {selectedSeats.length > 0 && (
                  <div className="mt-4 text-xs text-gray-400 text-center">
                    Selected seats will be held for 10 minutes
                  </div>
                )}

                {/* Seat Statistics */}
                <div className="mt-6 pt-4 border-t border-zinc-700">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Venue Info</h3>
                  <div className="space-y-1 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Total Seats:</span>
                      <span>{seatAvailability.seats.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span>{seatAvailability.seats.length - seatAvailability.purchases.length - seatAvailability.reservations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sold:</span>
                      <span>{seatAvailability.purchases.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SeatSelectionWithVenue;