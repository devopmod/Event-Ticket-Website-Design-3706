import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/Footer';
import { fetchEventById } from '../services/eventService';

const { FiArrowLeft, FiCheck } = FiIcons;

const SeatSelection = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Colors for sections
  const sectionColors = [
    '#fbbf24', // Yellow (Primary)
    '#3b82f6', // Blue
    '#10b981', // Green
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#14b8a6', // Teal
    '#f97316', // Orange
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      try {
        const eventData = await fetchEventById(id);
        if (eventData) {
          setEvent(eventData);
        }
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [id]);

  // Generate sections based on ticket types
  const generateSections = () => {
    if (!event?.ticketTypes) return [];

    return event.ticketTypes.map((ticketType, index) => ({
      id: String.fromCharCode(65 + index), // Convert to letters: 0=A, 1=B, etc.
      name: ticketType.name,
      price: ticketType.price,
      quantity: ticketType.quantity,
      color: sectionColors[index % sectionColors.length]
    }));
  };

  // Generate all seats for a section with mobile-friendly layout
  const generateSeats = (section) => {
    const seats = [];
    for (let seatNumber = 1; seatNumber <= section.quantity; seatNumber++) {
      const seatId = `${section.id}-${seatNumber}`;
      seats.push({
        id: seatId,
        section: section.id,
        number: seatNumber,
        price: section.price,
        taken: false // In a real app, this would be checked against purchased seats
      });
    }
    return seats;
  };

  const toggleSeatSelection = (seat) => {
    if (seat.taken) return;
    setSelectedSeats(prev => {
      const isSelected = prev.some(s => s.id === seat.id);
      if (isSelected) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const handleZoom = (change) => {
    if (isMobile) return; // Disable zoom on mobile
    setZoomLevel(prev => {
      const newZoom = prev + change;
      return Math.min(Math.max(newZoom, 0.5), 2);
    });
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
        <NavBar />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading event details...</h1>
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

  const sections = generateSections();

  return (
    <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
      <NavBar />
      <div className="pt-24 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              to={`/concert/${id}`}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <SafeIcon icon={FiArrowLeft} className="w-5 h-5 mr-2" />
              Back to event details
            </Link>
          </motion.div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{event.title}</h1>
            <p className="text-gray-400">{event.date} • {event.location}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Seat Map */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="bg-zinc-800 rounded-lg p-4 md:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg md:text-xl font-semibold">Select Your Seats</h2>
                  {!isMobile && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleZoom(-0.1)}
                        className="p-2 rounded-full bg-zinc-700 hover:bg-zinc-600"
                      >
                        -
                      </button>
                      <span className="text-sm">{Math.round(zoomLevel * 100)}%</span>
                      <button
                        onClick={() => handleZoom(0.1)}
                        className="p-2 rounded-full bg-zinc-700 hover:bg-zinc-600"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Notice */}
                {isMobile && (
                  <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-200">
                      Tap seats to select. Scroll horizontally to see all sections.
                    </p>
                  </div>
                )}

                {/* Seating Map */}
                <div className={`${isMobile ? 'overflow-x-auto' : 'overflow-auto'} ${isMobile ? 'h-auto' : 'h-96'} mb-4`}>
                  <div
                    style={{
                      transform: isMobile ? 'none' : `scale(${zoomLevel})`,
                      transformOrigin: 'center top',
                      padding: isMobile ? '10px' : '20px',
                      minWidth: isMobile ? `${sections.length * 280}px` : 'auto'
                    }}
                    className="mx-auto"
                  >
                    {/* Stage */}
                    <div className={`${isMobile ? 'w-full' : 'w-3/4'} h-8 md:h-12 bg-zinc-600 rounded-t-full mx-auto mb-6 md:mb-8 flex items-center justify-center`}>
                      <span className="text-white text-xs md:text-sm font-medium">STAGE</span>
                    </div>

                    {/* Sections */}
                    <div className={`flex ${isMobile ? 'flex-row space-x-6' : 'flex-col items-center space-y-8'}`}>
                      {sections.map((section) => {
                        const seats = generateSeats(section);
                        // Mobile: fewer seats per row, larger touch targets
                        const maxSeatsPerRow = isMobile ? 6 : Math.min(15, Math.ceil(Math.sqrt(section.quantity)));
                        const rows = Math.ceil(section.quantity / maxSeatsPerRow);

                        return (
                          <div key={section.id} className={`${isMobile ? 'flex-shrink-0 w-64' : 'w-full'}`}>
                            <h3 className="text-center text-xs md:text-sm font-medium mb-2">
                              Section {section.id} - {section.name} (€{section.price})
                            </h3>
                            <div className="flex flex-col items-center gap-1">
                              {Array.from({ length: rows }).map((_, rowIndex) => (
                                <div key={rowIndex} className="flex gap-1 justify-center flex-wrap">
                                  {seats
                                    .slice(rowIndex * maxSeatsPerRow, (rowIndex + 1) * maxSeatsPerRow)
                                    .map((seat) => {
                                      const isSelected = selectedSeats.some(s => s.id === seat.id);
                                      return (
                                        <button
                                          key={seat.id}
                                          className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'} rounded-sm flex items-center justify-center text-xs transition-all duration-200 active:scale-95
                                            ${seat.taken ? 'bg-zinc-600 cursor-not-allowed opacity-50' :
                                              isSelected ? 'bg-primary-400 text-black shadow-lg' : 'bg-opacity-60 hover:bg-opacity-100 cursor-pointer hover:scale-110'
                                            }`}
                                          style={{
                                            backgroundColor: seat.taken ? '#374151' :
                                              isSelected ? '#fbbf24' : section.color
                                          }}
                                          onClick={() => toggleSeatSelection(seat)}
                                          disabled={seat.taken}
                                          title={`Seat ${seat.id}`}
                                        >
                                          {isSelected ? <SafeIcon icon={FiCheck} className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} /> : ''}
                                        </button>
                                      );
                                    })}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Seat Legend */}
                <div className="flex flex-wrap justify-center gap-2 md:gap-4 pt-4 border-t border-zinc-700">
                  {sections.map(section => (
                    <div key={section.id} className="flex items-center">
                      <div
                        className="w-3 h-3 md:w-4 md:h-4 rounded-sm mr-1 md:mr-2"
                        style={{ backgroundColor: section.color }}
                      ></div>
                      <span className="text-xs md:text-sm">
                        {section.id} - €{section.price}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-zinc-600 mr-1 md:mr-2"></div>
                    <span className="text-xs md:text-sm">Unavailable</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-sm bg-primary-400 mr-1 md:mr-2"></div>
                    <span className="text-xs md:text-sm">Selected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selection Summary */}
            <div className="order-1 lg:order-2">
              <div className="bg-zinc-800 rounded-lg p-4 md:p-6 sticky top-24">
                <h2 className="text-lg md:text-xl font-semibold mb-4">Your Selection</h2>
                {selectedSeats.length === 0 ? (
                  <p className="text-gray-400 mb-4">No seats selected</p>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div className="max-h-48 md:max-h-60 overflow-auto">
                      {selectedSeats.map(seat => {
                        const section = sections.find(s => s.id === seat.section);
                        return (
                          <div
                            key={seat.id}
                            className="flex justify-between py-2 border-b border-zinc-700 last:border-0"
                          >
                            <span className="text-sm">
                              {section.name} ({seat.id})
                            </span>
                            <span className="font-medium text-sm">€{seat.price}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-600">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-semibold text-primary-400">
                        €{totalPrice}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (selectedSeats.length > 0) {
                      navigate(`/checkout/${id}`);
                    }
                  }}
                  disabled={selectedSeats.length === 0}
                  className={`w-full py-3 md:py-4 rounded-lg font-medium text-sm md:text-base transition-colors ${
                    selectedSeats.length > 0
                      ? 'bg-primary-400 hover:bg-primary-500 text-black'
                      : 'bg-zinc-700 cursor-not-allowed text-zinc-500'
                  }`}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SeatSelection;
