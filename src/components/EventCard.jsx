import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const EventCard = ({ event }) => {
  // Check if event has required properties
  if (!event || !event.title) {
    return null;
  }
  
  return (
    <Link to={`/concert/${event.id}`}>
      <motion.div className="flex-shrink-0 w-60 cursor-pointer group">
        <div className="relative overflow-hidden rounded-lg mb-3">
          <img 
            src={event.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
            alt={event.title} 
            className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-110" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70"></div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-white leading-tight group-hover:text-primary-400 transition-colors">
            {event.title}
          </h3>
          <p className="text-sm text-gray-400">
            {event.date}, {event.location}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};

export default EventCard;