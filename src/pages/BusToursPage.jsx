import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import FilterPanel from '../components/FilterPanel';
import EventCardList from '../components/EventCardList';
import Pagination from '../components/Pagination';
import { fetchEvents } from '../services/eventService';

const BusToursPage = () => {
  const [filters, setFilters] = useState({
    category: 'All',
    city: 'All',
    priceFrom: 0,
    dateFrom: '',
    dateTo: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const itemsPerPage = 12;

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const supabaseEvents = await fetchEvents();
        if (supabaseEvents && supabaseEvents.length > 0) {
          // Format the events to match the expected structure
          const formattedEvents = supabaseEvents
            .filter(event => event.category === 'bustour')
            .map(event => ({
              ...event,
              id: event.id,
              title: event.title,
              date: event.date,
              eventDate: event.event_date,
              location: event.location,
              category: event.category,
              artist: event.artist || 'N/A',
              genre: event.genre || 'N/A',
              image: event.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            }));
          setEvents(formattedEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error("Error loading events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  // Get unique cities from events for filter options
  const availableCities = useMemo(() => {
    const cities = ['All', ...new Set(events.map(event => event.location))];
    return cities.sort();
  }, [events]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filter by category
    if (filters.category !== 'All') {
      const categoryMap = {
        'Concert': 'concert',
        'Party': 'party',
        'Bustour': 'bustour'
      };
      filtered = filtered.filter(event => 
        event.category === categoryMap[filters.category]
      );
    }

    // Filter by city
    if (filters.city !== 'All') {
      filtered = filtered.filter(event => 
        event.location.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(event => 
        new Date(event.eventDate) >= new Date(filters.dateFrom)
      );
    }
    
    if (filters.dateTo) {
      filtered = filtered.filter(event => 
        new Date(event.eventDate) <= new Date(filters.dateTo)
      );
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    return filtered;
  }, [filters, events]);

  // Paginate filtered events
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEvents.slice(startIndex, endIndex);
  }, [filteredEvents, currentPage]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Bus Tours
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Comfortable transportation to your favorite events across Europe
          </p>
          {/* Results Summary */}
          <div className="mt-6 text-sm text-gray-400">
            {filteredEvents.length} events found
          </div>
        </motion.div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filter Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:flex-shrink-0"
          >
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              categories={['All', 'Bustour']}
              cities={availableCities}
              priceRange={[0, 200]}
            />
          </motion.div>

          {/* Right Content - Event Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            {/* Event Cards List */}
            <EventCardList events={paginatedEvents} loading={loading} />

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={filteredEvents.length}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BusToursPage;