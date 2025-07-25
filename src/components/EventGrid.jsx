import React from 'react';
import { motion } from 'framer-motion';
import EventGridCard from './EventGridCard';

const EventGrid = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No events available for the selected date
      </div>
    );
  }

  // Group events into columns of 3
  const createEventColumns = () => {
    const columns = [];
    const eventsPerColumn = 3;
    
    // Use only original events, no duplication
    for (let i = 0; i < events.length; i += eventsPerColumn) {
      const columnEvents = events.slice(i, i + eventsPerColumn);
      columns.push(columnEvents);
    }
    
    return columns;
  };

  const eventColumns = createEventColumns();

  return (
    <div className="h-80 overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide h-full">
        <div className="flex h-full">
          {eventColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex-shrink-0 w-72 mx-2 flex flex-col justify-start">
              {column.map((event, eventIndex) => (
                <motion.div
                  key={`${event.id}-${columnIndex}-${eventIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: eventIndex * 0.1 }}
                  className="mb-2"
                >
                  <EventGridCard event={event} />
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventGrid;