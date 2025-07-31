import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import AdminNavBar from '../AdminNavBar';
import PricingModal from './PricingModal';
import SeatStatusManager from './SeatStatusManager';
import supabase from '../../../lib/supabase';
import {
  fetchEventById,
  updateEventPriceBook,
  getEventStatistics,
  initializeRealtimeSubscription,
  regenerateEventSeats
} from '../../../services/eventService';

const { FiEdit, FiUsers, FiDollarSign, FiMapPin, FiCalendar, FiTrendingUp, FiSettings, FiBarChart3, FiRefreshCw, FiTool } = FiIcons;

const EventDashboard = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showSeatManager, setShowSeatManager] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');
  const [regeneratingSeats, setRegeneratingSeats] = useState(false);

  useEffect(() => {
    loadEvent();
    loadStatistics();
    
    // Set up Supabase Realtime subscription
    const cleanup = initializeRealtimeSubscription(
      id,
      // Price book update handler
      (newPriceBook) => {
        console.log('Price book updated via Realtime:', newPriceBook);
        setEvent(prev => prev ? { ...prev, price_book: newPriceBook } : null);
      },
      // Seat status change handler
      (payload) => {
        console.log('Seat status changed via Realtime:', payload);
        // Reload statistics when seat status changes
        loadStatistics();
      }
    );

    // Check Realtime connection status
    const checkRealtimeStatus = () => {
      try {
        // Check if we have active channels
        const channels = supabase.getChannels();
        if (channels && channels.length > 0) {
          const eventChannels = channels.filter(ch => ch.topic.includes(`event-${id}`) || ch.topic.includes(`event-seats-${id}`));
          if (eventChannels.length > 0) {
            const isConnected = eventChannels.some(ch => ch.state === 'joined');
            setRealtimeStatus(isConnected ? 'CONNECTED' : 'CONNECTING');
          } else {
            setRealtimeStatus('DISCONNECTED');
          }
        } else {
          setRealtimeStatus('DISCONNECTED');
        }
      } catch (error) {
        console.error('Error checking realtime status:', error);
        setRealtimeStatus('ERROR');
      }
    };

    // Check status initially and set up interval
    setTimeout(checkRealtimeStatus, 2000); // Give time for channels to connect
    const statusInterval = setInterval(checkRealtimeStatus, 5000);

    return () => {
      cleanup();
      clearInterval(statusInterval);
    };
  }, [id]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const eventData = await fetchEventById(id);
      setEvent(eventData);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getEventStatistics(id);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleUpdatePrices = async (newPriceBook) => {
    setUpdatingPrices(true);
    try {
      const updatedEvent = await updateEventPriceBook(id, newPriceBook);
      if (updatedEvent) {
        setEvent(updatedEvent);
        setShowPricingModal(false);
        console.log('Price book updated, Supabase Realtime will broadcast to other clients');
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      throw error; // Let modal handle the error
    } finally {
      setUpdatingPrices(false);
    }
  };

  // НОВАЯ функция для регенерации мест
  const handleRegenerateSeats = async () => {
    if (!window.confirm('Regenerate all seats for this event? This will reset all seat statuses to "free". This action cannot be undone.')) {
      return;
    }

    setRegeneratingSeats(true);
    try {
      const success = await regenerateEventSeats(id);
      if (success) {
        // Reload statistics to reflect new seats
        await loadStatistics();
        alert('Seats regenerated successfully!');
      } else {
        alert('Failed to regenerate seats. Please check the console for errors.');
      }
    } catch (error) {
      console.error('Error regenerating seats:', error);
      alert('Failed to regenerate seats. Please try again.');
    } finally {
      setRegeneratingSeats(false);
    }
  };

  const handleRefresh = () => {
    loadEvent();
    loadStatistics();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        <AdminNavBar />
        <div className="ml-0 lg:ml-64 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-400">Loading event dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        <AdminNavBar />
        <div className="ml-0 lg:ml-64 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event not found</h1>
            <p className="text-gray-400">The requested event could not be loaded.</p>
          </div>
        </div>
      </div>
    );
  }

  const venue = event.venue;
  const priceBook = event.price_book || {};
  const prices = Object.values(priceBook).filter(p => p > 0);
  const priceRange = prices.length > 0
    ? prices.length === 1
      ? `€${prices[0]}`
      : `€${Math.min(...prices)} - €${Math.max(...prices)}`
    : 'No prices set';

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <AdminNavBar />
      <div className="ml-0 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
                <div className="flex items-center space-x-4 text-gray-400">
                  <div className="flex items-center">
                    <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-1" />
                    {event.date}
                  </div>
                  <div className="flex items-center">
                    <SafeIcon icon={FiMapPin} className="w-4 h-4 mr-1" />
                    {event.location}
                  </div>
                  {venue && (
                    <div className="flex items-center">
                      <SafeIcon icon={FiMapPin} className="w-4 h-4 mr-1 text-primary-400" />
                      <span className="text-primary-400">{venue.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRefresh}
                  className="flex items-center px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                
                {/* НОВАЯ кнопка для регенерации мест */}
                {venue && (
                  <button
                    onClick={handleRegenerateSeats}
                    disabled={regeneratingSeats}
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      regeneratingSeats
                        ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                    title="Regenerate all seats from venue layout"
                  >
                    <SafeIcon icon={FiTool} className="w-4 h-4 mr-2" />
                    {regeneratingSeats ? 'Regenerating...' : 'Regenerate Seats'}
                  </button>
                )}

                {venue && (
                  <button
                    onClick={() => setShowSeatManager(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <SafeIcon icon={FiSettings} className="w-4 h-4 mr-2" />
                    Manage Seats
                  </button>
                )}
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="flex items-center px-4 py-2 bg-primary-400 hover:bg-primary-500 text-black rounded-lg transition-colors"
                >
                  <SafeIcon icon={FiEdit} className="w-4 h-4 mr-2" />
                  Edit Prices
                </button>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Today's Sales</p>
                    <h3 className="text-2xl font-bold mt-1">
                      €{statistics?.todaysSales?.toLocaleString() || '0'}
                    </h3>
                    <span className="text-green-400 text-xs">
                      {statistics?.salesGrowth || '+0%'} from yesterday
                    </span>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <SafeIcon icon={FiDollarSign} className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Tickets Sold</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {statistics?.soldSeats || 0}
                    </h3>
                    <span className="text-blue-400 text-xs">
                      of {statistics?.totalSeats || 0} total ({statistics?.occupancyRate || 0}%)
                    </span>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <SafeIcon icon={FiUsers} className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Revenue</p>
                    <h3 className="text-2xl font-bold mt-1">
                      €{statistics?.estimatedRevenue?.toLocaleString() || '0'}
                    </h3>
                    <span className="text-gray-400 text-xs">
                      Avg €{statistics?.averagePrice || 0} per ticket
                    </span>
                  </div>
                  <div className="p-3 bg-primary-500/20 rounded-lg">
                    <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-primary-400" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Availability</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {statistics?.freeSeats || 0}
                    </h3>
                    <span className="text-gray-400 text-xs">
                      {statistics?.heldSeats || 0} held, {statistics?.freeSeats || 0} free
                    </span>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <SafeIcon icon={FiBarChart3} className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pricing Overview */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Current Pricing</h2>
                  <button
                    onClick={() => setShowPricingModal(true)}
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    Edit Prices
                  </button>
                </div>

                <div className="space-y-4">
                  {venue ? (
                    // Show venue categories
                    Object.entries(venue.canvas_data?.categories || {}).map(([categoryId, category]) => {
                      const price = priceBook[categoryId];
                      return (
                        <div
                          key={categoryId}
                          className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div
                              className="w-6 h-6 rounded-full mr-3 border-2 border-white/20"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <h4 className="text-white font-medium">{categoryId}</h4>
                              <p className="text-gray-400 text-sm">{category.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold">
                              {price ? `€${price}` : 'No price set'}
                            </div>
                            <div className="text-gray-400 text-sm">per ticket</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Show general admission
                    <div className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full mr-3 bg-primary-400" />
                        <div>
                          <h4 className="text-white font-medium">General Admission</h4>
                          <p className="text-gray-400 text-sm">Open seating</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          €{priceBook.GENERAL || 0}
                        </div>
                        <div className="text-gray-400 text-sm">per ticket</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Seat Status Overview */}
              {venue && statistics && (
                <div className="bg-zinc-800 rounded-lg p-6 mt-6">
                  <h2 className="text-xl font-semibold mb-6">Seat Status Overview</h2>
                  
                  {/* Status Bars */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Sold</span>
                        <span className="text-green-400">{statistics.soldSeats} seats</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(statistics.soldSeats / statistics.totalSeats) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Held</span>
                        <span className="text-amber-400">{statistics.heldSeats} seats</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(statistics.heldSeats / statistics.totalSeats) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Available</span>
                        <span className="text-blue-400">{statistics.freeSeats} seats</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(statistics.freeSeats / statistics.totalSeats) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Event Details & Controls */}
            <div className="space-y-6">
              <div className="bg-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white font-medium ml-2 capitalize">{event.category}</span>
                  </div>
                  {event.artist && (
                    <div>
                      <span className="text-gray-400">Artist:</span>
                      <span className="text-white font-medium ml-2">{event.artist}</span>
                    </div>
                  )}
                  {event.genre && (
                    <div>
                      <span className="text-gray-400">Genre:</span>
                      <span className="text-white font-medium ml-2">{event.genre}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white font-medium ml-2">
                      {new Date(event.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="text-white font-medium ml-2">
                      {new Date(event.updated_at || event.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Status */}
              <div className="bg-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Real-time Status</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    realtimeStatus === 'CONNECTED' ? 'bg-green-500' : 
                    realtimeStatus === 'CONNECTING' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-400">
                    {realtimeStatus === 'CONNECTED' ? 'Connected to Supabase Realtime' :
                     realtimeStatus === 'CONNECTING' ? 'Connecting to Supabase Realtime...' :
                     `Disconnected (${realtimeStatus})`}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Price and seat changes are synchronized in real-time across all admin sessions.
                </p>
              </div>

              {event.description && (
                <div className="bg-zinc-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Description</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPricingModal && (
        <PricingModal
          event={event}
          onSave={handleUpdatePrices}
          onCancel={() => setShowPricingModal(false)}
          saving={updatingPrices}
        />
      )}

      {showSeatManager && venue && (
        <SeatStatusManager
          event={event}
          venue={venue}
          statistics={statistics}
          onClose={() => setShowSeatManager(false)}
          onUpdate={loadStatistics}
        />
      )}
    </div>
  );
};

export default EventDashboard;