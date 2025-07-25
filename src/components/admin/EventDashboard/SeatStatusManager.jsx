import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { getEventSeatStatuses, updateSeatStatus, bulkUpdateSeatStatuses } from '../../../services/eventService';

const { FiX, FiUsers, FiCheck, FiAlertCircle, FiRefreshCw } = FiIcons;

const SeatStatusManager = ({ event, venue, statistics, onClose, onUpdate }) => {
  const [seatStatuses, setSeatStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadSeatStatuses();
  }, [event.id]);

  const loadSeatStatuses = async () => {
    setLoading(true);
    try {
      const statuses = await getEventSeatStatuses(event.id);
      setSeatStatuses(statuses);
    } catch (error) {
      console.error('Error loading seat statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seatId) => {
    setSelectedSeats(prev => {
      const isSelected = prev.includes(seatId);
      if (isSelected) {
        return prev.filter(id => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredSeats = getFilteredSeats();
    const allSelected = filteredSeats.every(seat => selectedSeats.includes(seat.seat_id));
    
    if (allSelected) {
      // Deselect all filtered seats
      setSelectedSeats(prev => prev.filter(id => !filteredSeats.map(s => s.seat_id).includes(id)));
    } else {
      // Select all filtered seats
      const newSelected = [...new Set([...selectedSeats, ...filteredSeats.map(s => s.seat_id)])];
      setSelectedSeats(newSelected);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedSeats.length === 0) return;
    
    setUpdating(true);
    try {
      const updates = selectedSeats.map(seatId => ({
        seatId,
        status: bulkAction
      }));
      
      await bulkUpdateSeatStatuses(event.id, updates);
      await loadSeatStatuses();
      setSelectedSeats([]);
      setBulkAction('');
      onUpdate(); // Refresh parent statistics
    } catch (error) {
      console.error('Error updating seats:', error);
      alert('Failed to update seats. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSingleSeatUpdate = async (seatId, newStatus) => {
    try {
      await updateSeatStatus(event.id, seatId, newStatus);
      await loadSeatStatuses();
      onUpdate(); // Refresh parent statistics
    } catch (error) {
      console.error('Error updating seat:', error);
      alert('Failed to update seat. Please try again.');
    }
  };

  const getFilteredSeats = () => {
    if (filterStatus === 'all') return seatStatuses;
    return seatStatuses.filter(seat => seat.status === filterStatus);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sold': return 'bg-green-500';
      case 'held': return 'bg-amber-500';
      case 'free': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sold': return 'Sold';
      case 'held': return 'Held';
      case 'free': return 'Free';
      default: return 'Unknown';
    }
  };

  const filteredSeats = getFilteredSeats();
  const canPerformBulkAction = bulkAction && selectedSeats.length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Seat Status Manager</h2>
            <p className="text-gray-400 text-sm mt-1">
              {event.title} • {venue.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-zinc-700 bg-zinc-700/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter */}
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-primary-400"
                >
                  <option value="all">All Seats ({seatStatuses.length})</option>
                  <option value="free">Free ({statistics?.freeSeats || 0})</option>
                  <option value="held">Held ({statistics?.heldSeats || 0})</option>
                  <option value="sold">Sold ({statistics?.soldSeats || 0})</option>
                </select>
              </div>
              <button
                onClick={loadSeatStatuses}
                className="flex items-center px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
              >
                <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
              >
                {filteredSeats.every(seat => selectedSeats.includes(seat.seat_id))
                  ? 'Deselect All'
                  : 'Select All'} ({filteredSeats.length})
              </button>
              <div className="flex items-center space-x-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-primary-400"
                  disabled={selectedSeats.length === 0}
                >
                  <option value="">Select Action</option>
                  <option value="free">Mark as Free</option>
                  <option value="held">Mark as Held</option>
                  <option value="sold">Mark as Sold</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!canPerformBulkAction || updating}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    canPerformBulkAction && !updating
                      ? 'bg-primary-400 hover:bg-primary-500 text-black'
                      : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <SafeIcon icon={FiCheck} className="w-4 h-4 mr-2" />
                  {updating ? 'Updating...' : `Apply (${selectedSeats.length})`}
                </button>
              </div>
            </div>
          </div>
          
          {selectedSeats.length > 0 && (
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-200 text-sm">
                <SafeIcon icon={FiUsers} className="inline w-4 h-4 mr-1" />
                {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>

        {/* Seat List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-400">Loading seat statuses...</span>
            </div>
          ) : filteredSeats.length === 0 ? (
            <div className="text-center py-16">
              <SafeIcon icon={FiAlertCircle} className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No seats found</h3>
              <p className="text-gray-500">
                {filterStatus === 'all'
                  ? 'No seat statuses have been generated for this event.'
                  : `No seats with status "${filterStatus}" found.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSeats.map((seat) => {
                const isSelected = selectedSeats.includes(seat.seat_id);
                
                // Display capacity information
                const totalCapacity = seat.total_capacity || 1;
                const availableCapacity = seat.available_capacity || 0;
                const usedCapacity = totalCapacity - availableCapacity;
                const capacityPercent = totalCapacity > 0 ? (availableCapacity / totalCapacity) * 100 : 0;
                
                return (
                  <div
                    key={seat.seat_id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-400 bg-primary-400/10'
                        : 'border-zinc-600 hover:border-zinc-500'
                    }`}
                    onClick={() => handleSeatSelect(seat.seat_id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(seat.status)}`} />
                        <span className="font-medium text-white">
                          {seat.element_type === 'polygon' || seat.element_type === 'section' 
                            ? `${seat.element_type.charAt(0).toUpperCase() + seat.element_type.slice(1)} ${seat.seat_id}` 
                            : `Seat ${seat.seat_id}`}
                        </span>
                      </div>
                      {isSelected && (
                        <SafeIcon icon={FiCheck} className="w-4 h-4 text-primary-400" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-400">Status: </span>
                        <span className="text-white">{getStatusText(seat.status)}</span>
                      </div>
                      
                      {/* Capacity information */}
                      {totalCapacity > 1 && (
                        <div className="text-sm">
                          <span className="text-gray-400">Capacity: </span>
                          <span className="text-white">{availableCapacity}/{totalCapacity} available</span>
                          
                          {/* Capacity progress bar */}
                          <div className="w-full h-1.5 bg-zinc-600 rounded-full mt-1">
                            <div 
                              className="h-1.5 bg-primary-400 rounded-full" 
                              style={{ width: `${capacityPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm">
                        <span className="text-gray-400">Updated: </span>
                        <span className="text-white">
                          {new Date(seat.updated_at || seat.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="mt-3 flex space-x-1">
                      {['free', 'held', 'sold'].map((status) => (
                        <button
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (seat.status !== status) {
                              handleSingleSeatUpdate(seat.seat_id, status);
                            }
                          }}
                          disabled={seat.status === status}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            seat.status === status
                              ? `${getStatusColor(status)} text-white cursor-default`
                              : 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                          }`}
                          title={`Mark as ${getStatusText(status)}`}
                        >
                          {getStatusText(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-700 p-6 bg-zinc-700/20">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              Showing {filteredSeats.length} of {seatStatuses.length} seats
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                Free: {statistics?.freeSeats || 0}
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-2" />
                Held: {statistics?.heldSeats || 0}
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                Sold: {statistics?.soldSeats || 0}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SeatStatusManager;