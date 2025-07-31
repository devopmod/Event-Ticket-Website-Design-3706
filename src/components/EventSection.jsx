import React from 'react';
import { motion } from 'framer-motion';
import EventCard from './EventCard';

const EventSection = ({ title, events }) => {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-sm font-medium uppercase tracking-wider mb-6 text-gray-300"
      >
        {title}
      </motion.h2>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-6 pb-4">
          {events.map((event, index) => (
            <motion.div
              key={`${event.id}-${index}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventSection;