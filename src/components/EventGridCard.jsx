import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const EventGridCard = ({ event }) => {
  return (
    <Link to={`/event/${event.id}`}>
      <motion.div
        className="flex items-center cursor-pointer h-22 w-64 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
      >
        {/* Image Section - 1/3 width */}
        <div className="flex-shrink-0 w-20 h-20 relative">
          <img
            src={event.image}
            alt={event.title}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg opacity-70"></div>
        </div>

        {/* Content Section - 2/3 width */}
        <div className="flex-1 ml-3 flex flex-col justify-center h-20">
          <h6 className="text-white font-medium text-sm leading-4 mb-3 line-clamp-2">
            {event.title}
          </h6>
          <p className="text-gray-400 text-xs mb-1">
            {event.date}
          </p>
          <p className="text-gray-400 text-xs">
            {event.location}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};

export default EventGridCard;