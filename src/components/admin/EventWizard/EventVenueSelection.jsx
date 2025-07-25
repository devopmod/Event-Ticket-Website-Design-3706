import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { fetchVenues } from '../../../services/venueService';

const { FiMapPin, FiUsers, FiCheck } = FiIcons;

const EventVenueSelection = ({ selectedVenue, onVenueSelect }) => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const venueData = await fetchVenues();
      setVenues(venueData || []);
    } catch (error) {
      console.error('Error loading venues:', error);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  const getVenueStats = (venue) => {
    let seatCount = 0;
    let categoryCount = 0;

    try {
      if (venue.canvas_data) {
        const canvasData = typeof venue.canvas_data === 'string' 
          ? JSON.parse(venue.canvas_data) 
          : venue.canvas_data;

        if (canvasData.elements) {
          seatCount = canvasData.elements.filter(el => el.type === 'seat').length;
        }
        
        if (canvasData.categories) {
          categoryCount = Object.keys(canvasData.categories).length;
        }
      }
    } catch (error) {
      console.error('Error parsing venue data:', error);
    }

    return { seatCount, categoryCount };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Select Venue</h3>
        <p className="text-gray-400 mb-6">
          Choose a venue for your event, or skip this step for general admission events.
        </p>
      </div>

      {/* No Venue Option */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
          !selectedVenue 
            ? 'border-primary-400 bg-primary-400/10' 
            : 'border-zinc-600 hover:border-zinc-500'
        }`}
        onClick={() => onVenueSelect(null)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-white mb-1">
              No Venue (General Admission)
            </h4>
            <p className="text-gray-400 text-sm">
              Create an event without specific seating arrangements
            </p>
          </div>
          {!selectedVenue && (
            <SafeIcon icon={FiCheck} className="w-6 h-6 text-primary-400" />
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-zinc-700 rounded-lg p-4">
                <div className="h-4 bg-zinc-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-zinc-600 rounded w-full mb-2"></div>
                <div className="h-3 bg-zinc-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-12">
          <SafeIcon icon={FiMapPin} className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No venues available</h3>
          <p className="text-gray-500 mb-6">
            Create venues in the Venue Management section first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {venues.map((venue) => {
            const { seatCount, categoryCount } = getVenueStats(venue);
            const isSelected = selectedVenue?.id === venue.id;

            return (
              <motion.div
                key={venue.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-primary-400 bg-primary-400/10' 
                    : 'border-zinc-600 hover:border-zinc-500'
                }`}
                onClick={() => onVenueSelect(venue)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-white mb-1">
                      {venue.name || 'Unnamed Venue'}
                    </h4>
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {venue.description || 'No description'}
                    </p>
                  </div>
                  {isSelected && (
                    <SafeIcon icon={FiCheck} className="w-6 h-6 text-primary-400 ml-2" />
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center">
                    <SafeIcon icon={FiUsers} className="w-4 h-4 mr-1" />
                    {seatCount} seats
                  </div>
                  <div>
                    {categoryCount} categories
                  </div>
                </div>

                {venue.created_at && (
                  <div className="text-xs text-gray-500 mt-2">
                    Created {new Date(venue.created_at).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {selectedVenue && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-700/50 rounded-lg p-4"
        >
          <h4 className="text-white font-medium mb-2">Selected Venue</h4>
          <div className="text-gray-300 text-sm">
            <div className="mb-1"><strong>Name:</strong> {selectedVenue.name}</div>
            <div className="mb-1"><strong>Description:</strong> {selectedVenue.description}</div>
            {(() => {
              const { seatCount, categoryCount } = getVenueStats(selectedVenue);
              return (
                <div>
                  <strong>Capacity:</strong> {seatCount} seats in {categoryCount} categories
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EventVenueSelection;