import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import NavBar from '../components/layout/NavBar';
import HeroSection from '../components/HeroSection';
import EventSection from '../components/EventSection';
import CalendarSection from '../components/CalendarSection';
import Footer from '../components/Footer';
import { fetchEvents } from '../services/eventService';

const Home = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        console.log("Fetching events...");
        const supabaseEvents = await fetchEvents();
        console.log("Events fetched:", supabaseEvents);
        
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

  // Filter events based on selected date
  const filterEventsByDate = (events, date) => {
    // For demo purposes, we'll show all events for now
    // In real implementation, you would filter by actual event dates
    return events;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Filter events by category
  const popularEvents = filterEventsByDate(
    events.filter(event => event.category === 'concert' || event.category === 'party'),
    selectedDate
  );

  const bustours = filterEventsByDate(
    events.filter(event => event.category === 'bustour'),
    selectedDate
  );

  const concerts = filterEventsByDate(
    events.filter(event => event.category === 'concert'),
    selectedDate
  );

  const parties = filterEventsByDate(
    events.filter(event => event.category === 'party'),
    selectedDate
  );

  return (
    <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
      <NavBar />
      <div className="relative">
        {/* Hero Section */}
        <HeroSection />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Popular Events - with margin-top 0 */}
          <div className="mt-0">
            <EventSection title="Popular Events" events={popularEvents} />
          </div>

          {/* Calendar Section with Event Grid */}
          <div className="mt-12">
            <CalendarSection onDateSelect={handleDateSelect} events={events} />
          </div>

          {/* Bustours Section */}
          <div className="mt-12">
            <EventSection title="Bustours" events={bustours} />
          </div>

          {/* Parties Section */}
          <div className="mt-12">
            <EventSection title="Parties" events={parties} />
          </div>

          {/* Concerts Section */}
          <div className="mt-12">
            <EventSection title="Concerts" events={concerts} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;