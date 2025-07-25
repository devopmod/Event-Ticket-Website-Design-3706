import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import FilterPanel from '../components/FilterPanel';
import EventCardList from '../components/EventCardList';
import Pagination from '../components/Pagination';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/Footer';
import { fetchEvents } from '../services/eventService';

const ConcertList = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [filters, setFilters] = useState({
    category: 'All',
    artist: 'All',
    genre: 'All',
    city: 'All',
    priceFrom: 0,
    dateFrom: '',
    dateTo: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 12;

  // Get search query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const search = urlParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [location.search]);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const supabaseEvents = await fetchEvents();
        if (supabaseEvents && supabaseEvents.length > 0) {
          // Format the events to match the expected structure
          const formattedEvents = supabaseEvents.map(event => ({
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

  // Get unique options from events for filter options
  const availableCities = useMemo(() => {
    const cities = ['All', ...new Set(events.map(event => event.location))];
    return cities.sort();
  }, [events]);

  const availableArtists = useMemo(() => {
    const artists = ['All', ...new Set(events.map(event => event.artist).filter(artist => artist && artist !== 'N/A'))];
    return artists.sort();
  }, [events]);

  const availableGenres = useMemo(() => {
    const genres = ['All', ...new Set(events.map(event => event.genre).filter(genre => genre && genre !== 'N/A' && genre !== 'Transport'))];
    return genres.sort();
  }, [events]);

  // Filter events based on current filters and search query
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Apply search filter first
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.artist && event.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.genre && event.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        event.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

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

    // Filter by artist
    if (filters.artist !== 'All') {
      filtered = filtered.filter(event => 
        event.artist === filters.artist
      );
    }

    // Filter by genre
    if (filters.genre !== 'All') {
      filtered = filtered.filter(event => 
        event.genre === filters.genre
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
  }, [filters, events, searchQuery]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
      <NavBar />
      <div className="pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {searchQuery ? `Search Results for "${searchQuery}"` : t('concerts.title')}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {searchQuery 
                ? `Found ${filteredEvents.length} events matching your search`
                : t('concerts.subtitle')
              }
            </p>
            
            {/* Results Summary */}
            <div className="mt-6 text-sm text-gray-400">
              {filteredEvents.length} {t('concerts.results')}
            </div>
          </div>

          {/* Clear Search Button */}
          {searchQuery && (
            <div className="mb-6 text-center">
              <button
                onClick={() => {
                  setSearchQuery('');
                  window.history.pushState({}, '', window.location.pathname);
                }}
                className="inline-flex items-center px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                ✕ Clear search
              </button>
            </div>
          )}

          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Panel - now responsive */}
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              categories={['All', 'Bustour', 'Concert', 'Party']}
              cities={availableCities}
              artists={availableArtists}
              genres={availableGenres}
              priceRange={[0, 200]}
            />

            {/* Right Content - Event Cards */}
            <div className="flex-1">
              {/* Event Cards List */}
              <EventCardList
                events={paginatedEvents}
                loading={loading}
              />

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={filteredEvents.length}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ConcertList;