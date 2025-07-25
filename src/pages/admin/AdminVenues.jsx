import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../components/common/SafeIcon';
import AdminNavBar from '../../components/admin/AdminNavBar';
import VenueDesigner from '../../components/admin/VenueDesigner';
import VenueVerificationModal from '../../components/admin/VenueVerificationModal';
import VenueVerificationBadge from '../../components/admin/VenueVerificationBadge';
import { 
  fetchVenues, 
  createVenue,
  updateVenue, 
  deleteVenue,
  getVenueSeatsCount
} from '../../services/venueService';
import { 
  compareVenueSeatCounts, 
  generateSeatDiscrepancyNotification 
} from '../../services/venueVerificationService';
import { regenerateSeatsForVenue } from '../../services/eventService';

const { 
  FiPlus, 
  FiSearch, 
  FiEdit, 
  FiTrash2, 
  FiMapPin, 
  FiUsers, 
  FiX,
  FiGrid,
  FiCheckCircle,
  FiAlertTriangle
} = FiIcons;

const AdminVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDesigner, setShowDesigner] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Verification states
  const [verificationData, setVerificationData] = useState({});
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [venueStats, setVenueStats] = useState({});

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const venueData = await fetchVenues();
      setVenues(venueData || []);
      
      // Load stats for each venue
      const stats = {};
      for (const venue of venueData || []) {
        const venueSeatsCount = await getVenueSeatsCount(venue.id);
        stats[venue.id] = venueSeatsCount;
      }
      setVenueStats(stats);
    } catch (error) {
      console.error('Error loading venues:', error);
      setError('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  // Venue verification function
  const verifyVenueSeats = async (venue) => {
    try {
      console.log('Starting venue seats verification for:', venue.id);
      const comparison = await compareVenueSeatCounts(venue.id, venue);
      
      // Generate notification
      const notification = generateSeatDiscrepancyNotification(comparison);
      
      // Update state
      setVerificationData(prev => ({
        ...prev,
        [venue.id]: comparison
      }));

      // Add notification if there are discrepancies
      if (comparison.discrepancies.hasDiscrepancies) {
        setNotifications(prev => [
          {
            id: Date.now(),
            venueId: venue.id,
            ...notification
          },
          ...prev
        ]);
      }

      return comparison;
    } catch (error) {
      console.error('Error verifying venue seats:', error);
      setNotifications(prev => [{
        id: Date.now(),
        type: 'error',
        title: 'Verification Failed',
        message: `Failed to verify seats for venue: ${error.message}`,
        icon: 'FiAlertTriangle'
      }, ...prev]);
      return null;
    }
  };

  // Filter venues based on search term
  const filteredVenues = venues.filter(venue =>
    venue.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateVenue = () => {
    setSelectedVenue(null);
    setError('');
    setShowDesigner(true);
  };

  const handleEditVenue = (venue) => {
    setSelectedVenue(venue);
    setError('');
    setShowDesigner(true);
  };

  const handleSaveVenue = async (venueData) => {
    setSaving(true);
    setError('');

    try {
      let result;
      if (selectedVenue) {
        result = await updateVenue(selectedVenue.id, venueData);
      } else {
        result = await createVenue(venueData);
      }

      if (result) {
        // Update venues list
        setVenues(prev => 
          selectedVenue
            ? prev.map(v => v.id === selectedVenue.id ? result : v)
            : [result, ...prev]
        );

        // Update venue stats
        const venueSeatsCount = await getVenueSeatsCount(result.id);
        setVenueStats(prev => ({
          ...prev,
          [result.id]: venueSeatsCount
        }));

        // Perform verification
        const verification = await verifyVenueSeats(result);
        
        // Show modal if there are discrepancies
        if (verification?.discrepancies.hasDiscrepancies) {
          setSelectedVenue(result);
          setShowVerificationModal(true);
        }

        setShowDesigner(false);
        if (!verification?.discrepancies.hasDiscrepancies) {
          setSelectedVenue(null);
        }
      }
    } catch (error) {
      console.error('Error saving venue:', error);
      setError(`Failed to save venue: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSeats = async (venueId) => {
    setIsRegenerating(true);
    try {
      const success = await regenerateSeatsForVenue(venueId);
      if (success) {
        // Re-verify seats after regeneration
        const venue = venues.find(v => v.id === venueId);
        if (venue) {
          await verifyVenueSeats(venue);
        }
        setNotifications(prev => [{
          id: Date.now(),
          type: 'success',
          title: 'Seats Regenerated',
          message: 'Successfully regenerated all event seats',
          icon: 'FiCheckCircle'
        }, ...prev]);
        setShowVerificationModal(false);
      } else {
        throw new Error('Failed to regenerate seats');
      }
    } catch (error) {
      console.error('Error regenerating seats:', error);
      setNotifications(prev => [{
        id: Date.now(),
        type: 'error',
        title: 'Regeneration Failed',
        message: error.message,
        icon: 'FiAlertTriangle'
      }, ...prev]);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDeleteVenue = async (id) => {
    if (window.confirm('Are you sure you want to delete this venue? This will affect all associated events.')) {
      try {
        const success = await deleteVenue(id);
        if (success) {
          setVenues(venues.filter(venue => venue.id !== id));
          // Remove from stats
          setVenueStats(prev => {
            const newStats = { ...prev };
            delete newStats[id];
            return newStats;
          });
          // Remove from verification data
          setVerificationData(prev => {
            const newData = { ...prev };
            delete newData[id];
            return newData;
          });
        }
      } catch (error) {
        console.error('Error deleting venue:', error);
        setError('Failed to delete venue');
      }
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <AdminNavBar />
      
      <div className="ml-0 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold">Venue Management</h1>
              <p className="text-gray-400 mt-1">Design and manage venue layouts with seating arrangements</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search venues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg w-full sm:w-64 focus:outline-none focus:border-primary-400"
                />
              </div>
              
              <button
                onClick={handleCreateVenue}
                className="flex items-center justify-center px-4 py-2 bg-primary-400 hover:bg-primary-500 text-black rounded-lg transition-colors"
              >
                <SafeIcon icon={FiPlus} className="mr-2" />
                New Venue
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Venues Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-zinc-800 rounded-lg p-6">
                    <div className="h-4 bg-zinc-700 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-zinc-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-zinc-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="text-center py-16">
              <SafeIcon icon={FiMapPin} className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">
                {searchTerm ? 'No venues found' : 'No venues yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first venue to get started with seating arrangements'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreateVenue}
                  className="px-6 py-3 bg-primary-400 hover:bg-primary-500 text-black rounded-lg transition-colors"
                >
                  Create First Venue
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVenues.map((venue) => {
                const stats = venueStats[venue.id] || { total: 0, byType: {}, elements: 0, bookableElements: 0 };
                
                return (
                  <motion.div
                    key={venue.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700/50 transition-colors cursor-pointer group"
                  >
                    {/* Venue Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {venue.name || 'Unnamed Venue'}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {venue.description || 'No description'}
                        </p>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditVenue(venue);
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-zinc-600 rounded-lg transition-colors"
                          title="Edit Venue"
                        >
                          <SafeIcon icon={FiEdit} className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVenue(venue.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Venue"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Venue Statistics */}
                    <div className="space-y-3 mb-4">
                      {/* Total Seats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <SafeIcon icon={FiUsers} className="w-4 h-4 text-primary-400 mr-2" />
                          <span className="text-gray-300 text-sm">Total Seats</span>
                        </div>
                        <span className="text-white font-semibold">{stats.total}</span>
                      </div>

                      {/* Elements Breakdown */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <SafeIcon icon={FiGrid} className="w-4 h-4 text-blue-400 mr-2" />
                          <span className="text-gray-300 text-sm">Elements</span>
                        </div>
                        <span className="text-white font-semibold">{stats.elements}</span>
                      </div>

                      {/* Element Types Breakdown */}
                      {stats.elements > 0 && (
                        <div className="text-xs text-gray-400 space-y-1">
                          {stats.byType.seat > 0 && (
                            <div className="flex justify-between">
                              <span>• Individual Seats:</span>
                              <span>{stats.byType.seat} ({stats.byType.seat} seats)</span>
                            </div>
                          )}
                          {stats.byType.section > 0 && (
                            <div className="flex justify-between">
                              <span>• Sections:</span>
                              <span>{stats.byType.section} elements</span>
                            </div>
                          )}
                          {stats.byType.polygon > 0 && (
                            <div className="flex justify-between">
                              <span>• Polygons:</span>
                              <span>{stats.byType.polygon} elements</span>
                            </div>
                          )}
                          {stats.bookableElements !== stats.elements && (
                            <div className="flex justify-between text-amber-400">
                              <span>• Bookable:</span>
                              <span>{stats.bookableElements}/{stats.elements}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Categories */}
                      {Object.keys(stats.byCategory || {}).length > 0 && (
                        <div className="pt-2 border-t border-zinc-700">
                          <div className="text-xs text-gray-400 mb-1">Categories:</div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(stats.byCategory).map(([categoryId, count]) => (
                              <span 
                                key={categoryId}
                                className="inline-flex items-center px-2 py-1 bg-zinc-700 text-gray-300 rounded text-xs"
                              >
                                {categoryId}: {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Verification Badge */}
                    <div className="mt-4 pt-3 border-t border-zinc-700">
                      <VenueVerificationBadge
                        verificationData={verificationData[venue.id]}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVenue(venue);
                          setShowVerificationModal(true);
                        }}
                      />
                    </div>

                    {/* Creation Date */}
                    {venue.created_at && (
                      <div className="text-xs text-gray-500 mt-3">
                        Created {new Date(venue.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Venue Designer Modal */}
      {showDesigner && (
        <VenueDesigner
          venue={selectedVenue}
          onSave={handleSaveVenue}
          onCancel={() => {
            setShowDesigner(false);
            setSelectedVenue(null);
          }}
          saving={saving}
        />
      )}

      {/* Verification Modal */}
      <VenueVerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setSelectedVenue(null);
        }}
        verificationData={selectedVenue ? verificationData[selectedVenue.id] : null}
        onRegenerate={() => handleRegenerateSeats(selectedVenue.id)}
        isRegenerating={isRegenerating}
      />

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`flex items-center p-4 rounded-lg shadow-lg max-w-md ${
              notification.type === 'error' ? 'bg-red-500/90' :
              notification.type === 'warning' ? 'bg-yellow-500/90' :
              notification.type === 'success' ? 'bg-green-500/90' :
              'bg-blue-500/90'
            }`}
          >
            <SafeIcon icon={notification.icon} className="w-5 h-5 mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium">{notification.title}</div>
              <div className="text-sm opacity-90 break-words">{notification.message}</div>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="ml-3 p-1 hover:bg-black/20 rounded flex-shrink-0"
            >
              <SafeIcon icon={FiX} className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminVenues;