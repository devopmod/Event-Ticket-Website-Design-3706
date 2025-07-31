import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { fetchEvents } from '../services/eventService';

const { FiSearch } = FiIcons;

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load all events once when component mounts
  useEffect(() => {
    const loadAllEvents = async () => {
      try {
        const events = await fetchEvents();
        setAllEvents(events || []);
      } catch (error) {
        console.error('Error loading events for search:', error);
      }
    };
    loadAllEvents();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      setLoading(true);
      
      // Filter events based on search query
      const filteredResults = allEvents.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.artist && event.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.genre && event.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        event.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Sort results by relevance (title matches first, then others)
      const sortedResults = filteredResults.sort((a, b) => {
        const queryLower = searchQuery.toLowerCase();
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        
        // Exact title matches first
        if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1;
        if (!aTitle.includes(queryLower) && bTitle.includes(queryLower)) return 1;
        
        // Then by event date (upcoming events first)
        return new Date(a.event_date) - new Date(b.event_date);
      });

      setSearchResults(sortedResults.slice(0, 8)); // Limit to 8 results
      setShowResults(true);
      setLoading(false);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setLoading(false);
    }
  }, [searchQuery, allEvents]);

  // Format date to DD.MM.YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '.');
  };

  const handleEventClick = (event) => {
    navigate(`/concert/${event.id}`);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleEventClick(searchResults[0]);
    }
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-primary-400 text-black px-1 rounded">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg"
    >
      <div className="relative">
        <div className="relative bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <input
            type="text"
            placeholder="Search by Artist, Event or Venue"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-6 py-4 bg-transparent text-white placeholder-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400/50"
          />
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-400 rounded-full animate-spin"></div>
            ) : (
              <SafeIcon icon={FiSearch} className="w-5 h-5 text-gray-300" />
            )}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute w-full mt-2 bg-zinc-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-zinc-700 z-50 max-h-80 overflow-y-auto">
            {searchResults.length > 0 ? (
              <>
                <div className="p-3 border-b border-zinc-700">
                  <p className="text-xs text-gray-400">
                    {searchResults.length} result{searchResults.length > 1 ? 's' : ''} found
                  </p>
                </div>
                {searchResults.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="p-3 hover:bg-zinc-700/70 cursor-pointer transition-colors border-b border-zinc-700 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Event Image */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={event.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>
                      
                      {/* Event Info - SIMPLIFIED AS REQUESTED */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-white font-medium text-sm truncate">
                            {highlightMatch(event.title, searchQuery)}
                          </h3>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>{highlightMatch(event.location, searchQuery)}</span>
                          <span>•</span>
                          <span>{formatDate(event.event_date)}</span>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-primary-400 font-medium text-sm">
                          from €45
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {searchResults.length >= 8 && (
                  <div className="p-3 border-t border-zinc-700 text-center">
                    <button
                      onClick={() => {
                        navigate(`/concerts?search=${encodeURIComponent(searchQuery)}`);
                        setSearchQuery('');
                        setShowResults(false);
                      }}
                      className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-gray-400">
                <div className="mb-2">🔍</div>
                <p className="text-sm">No events found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try searching for artist, venue, or event name</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchBar;