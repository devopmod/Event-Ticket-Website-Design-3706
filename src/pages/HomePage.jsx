import React, { useState } from 'react';
import { motion } from 'framer-motion';
import HeroSection from '../components/HeroSection';
import EventSection from '../components/EventSection';
import CalendarSection from '../components/CalendarSection';
import { mockEvents } from '../data/mockData';

const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filter events based on selected date
  const filterEventsByDate = (events, date) => {
    // For demo purposes, we'll show all events for now
    // In real implementation, you would filter by actual event dates
    return events;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const popularEvents = filterEventsByDate(
    mockEvents.filter(event => event.category === 'concert' || event.category === 'party'),
    selectedDate
  );

  const bustours = filterEventsByDate(
    mockEvents.filter(event => event.category === 'bustour'),
    selectedDate
  );

  const concerts = filterEventsByDate(
    mockEvents.filter(event => event.category === 'concert'),
    selectedDate
  );

  const parties = filterEventsByDate(
    mockEvents.filter(event => event.category === 'party'),
    selectedDate
  );

  return (
    <div className="relative">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Popular Events - with margin-top 0 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-0"
        >
          <EventSection title="Popular Events" events={popularEvents} />
        </motion.div>

        {/* Calendar Section with Event Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <CalendarSection onDateSelect={handleDateSelect} events={mockEvents} />
        </motion.div>

        {/* Bustours Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12"
        >
          <EventSection title="Bustours" events={bustours} />
        </motion.div>

        {/* Parties Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <EventSection title="Parties" events={parties} />
        </motion.div>

        {/* Concerts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-12"
        >
          <EventSection title="Concerts" events={concerts} />
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;