import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../components/common/SafeIcon';
import AdminNavBar from '../../components/admin/AdminNavBar';
import VenueDesigner from '../../components/admin/VenueDesigner';
import supabase from '../../lib/supabase';

const { FiPlus, FiSearch, FiEdit, FiTrash2, FiMap, FiUsers } = FiIcons;

// Table name for venues
const VENUES_TABLE = 'venues_fanaticka_7a3x9d';

const AdminVenues = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDesigner, setShowDesigner] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    setLoading(true);
    try {
      console.log('Loading venues from table:', VENUES_TABLE);
      const { data, error } = await supabase
        .from(VENUES_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Venues loaded:', data?.length || 0);
      setVenues(data || []);
    } catch (error) {
      console.error('Error loading venues:', error);
      setError(`Failed to load venues: ${error.message}`);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteVenue = async (venueId) => {
    if (!window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from(VENUES_TABLE)
        .delete()
        .eq('id', venueId);

      if (error) {
        throw error;
      }

      // Update venues list after deletion
      setVenues(venues.filter(v => v.id !== venueId));
    } catch (error) {
      console.error('Error deleting venue:', error);
      alert('Failed to delete venue. Please try again.');
    }
  };

  const handleSaveVenue = async (venueData) => {
    setSaving(true);
    setError('');
    try {
      // Prepare data for saving
      const dataToSave = {
        name: venueData.name,
        description: venueData.description,
        canvas_data: venueData.canvas_data, // Store as JSONB object directly
        layout_data: JSON.stringify(venueData.canvas_data), // Also store as string in layout_data for compatibility
        updated_at: new Date().toISOString()
      };

      console.log('Saving venue data:', dataToSave);
      
      let result;
      
      if (selectedVenue) {
        // Update existing venue
        const { data, error } = await supabase
          .from(VENUES_TABLE)
          .update(dataToSave)
          .eq('id', selectedVenue.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        result = data?.[0];
        
        // Update venues list
        if (result) {
          setVenues(venues.map(v => v.id === selectedVenue.id ? result : v));
        }
      } else {
        // Create new venue
        const { data, error } = await supabase
          .from(VENUES_TABLE)
          .insert([{
            ...dataToSave,
            created_at: new Date().toISOString()
          }])
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        result = data?.[0];
        
        // Add new venue to list
        if (result) {
          setVenues([result, ...venues]);
        }
      }

      if (result) {
        // Close designer after successful save
        setShowDesigner(false);
        setSelectedVenue(null);
        console.log('Venue saved successfully:', result);
      } else {
        throw new Error('No result returned from database');
      }
    } catch (error) {
      console.error('Error saving venue:', error);
      setError(`Failed to save venue: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDesigner = () => {
    setShowDesigner(false);
    setSelectedVenue(null);
    setError('');
  };

  const filteredVenues = venues.filter(venue => 
    venue.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    venue.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showDesigner) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        <AdminNavBar />
        <div className="ml-0 lg:ml-64 h-screen">
          <VenueDesigner 
            venue={selectedVenue} 
            onSave={handleSaveVenue} 
            onCancel={handleCancelDesigner}
            saving={saving}
          />
          {error && (
            <div className="fixed top-4 right-4 z-50 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg max-w-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <AdminNavBar />
      <div className="ml-0 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold">Venue Management</h1>
              <p className="text-gray-400 mt-1">Design and manage event venues</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                <SafeIcon 
                  icon={FiSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
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
                className="flex items-center justify-center bg-primary-400 hover:bg-primary-500 text-black px-4 py-2 rounded-lg transition-colors"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <SafeIcon icon={FiMap} className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">
                {searchTerm ? 'No venues found' : 'No venues yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first venue to get started'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleCreateVenue}
                  className="bg-primary-400 hover:bg-primary-500 text-black px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create First Venue
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVenues.map((venue, index) => {
                let seatCount = 0;
                try {
                  // Try to get seat count from canvas_data first, then fallback to layout_data if needed
                  if (venue.canvas_data && venue.canvas_data.elements) {
                    seatCount = venue.canvas_data.elements.filter(el => el.type === 'seat').length || 0;
                  } else if (venue.layout_data) {
                    // Parse layout_data if it's a string
                    const layoutData = typeof venue.layout_data === 'string' 
                      ? JSON.parse(venue.layout_data) 
                      : venue.layout_data;
                    seatCount = layoutData.elements?.filter(el => el.type === 'seat').length || 0;
                  }
                } catch (error) {
                  console.error('Error parsing venue data:', error);
                }

                return (
                  <motion.div
                    key={venue.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-zinc-800 rounded-lg p-6 hover:bg-zinc-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {venue.name || 'Unnamed Venue'}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {venue.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex space-x-1 ml-4">
                        <button
                          onClick={() => handleEditVenue(venue)}
                          className="p-2 hover:bg-zinc-600 rounded-lg transition-colors"
                          title="Edit Venue"
                        >
                          <SafeIcon icon={FiEdit} className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteVenue(venue.id)}
                          className="p-2 hover:bg-zinc-600 rounded-lg transition-colors"
                          title="Delete Venue"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-400">
                        <SafeIcon icon={FiUsers} className="w-4 h-4 mr-1" />
                        {seatCount} seats
                      </div>
                      <div className="text-gray-500">
                        {venue.created_at ? new Date(venue.created_at).toLocaleDateString() : 'New'}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-700">
                      <button
                        onClick={() => handleEditVenue(venue)}
                        className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <SafeIcon icon={FiMap} className="mr-2 w-4 h-4" />
                        Open Designer
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVenues;