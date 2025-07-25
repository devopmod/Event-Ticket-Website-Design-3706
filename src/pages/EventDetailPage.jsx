import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { mockEvents } from '../data/mockData';

const { FiArrowLeft, FiCalendar, FiMapPin, FiUsers, FiClock } = FiIcons;

const EventDetailPage = () => {
  const { id } = useParams();
  const event = mockEvents.find(e => e.id === parseInt(id));

  if (!event) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Link to="/" className="text-primary-400 hover:text-primary-300">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <SafeIcon icon={FiArrowLeft} className="w-5 h-5 mr-2" />
            Back to events
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Event Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-xl"
          >
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-80 md:h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </motion.div>

          {/* Event Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <span className="inline-block px-3 py-1 bg-primary-400/20 text-primary-400 rounded-full text-sm font-medium mb-4 capitalize">
                {event.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {event.title}
              </h1>
              <p className="text-gray-300 leading-relaxed">
                {event.description || 'Experience an unforgettable night of music and entertainment. Join us for this spectacular event that promises to deliver amazing performances and create lasting memories.'}
              </p>
            </div>

            {/* Event Info */}
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <SafeIcon icon={FiCalendar} className="w-5 h-5 mr-3 text-primary-400" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <SafeIcon icon={FiMapPin} className="w-5 h-5 mr-3 text-primary-400" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <SafeIcon icon={FiClock} className="w-5 h-5 mr-3 text-primary-400" />
                <span>Doors open at 8:00 PM</span>
              </div>
              <div className="flex items-center text-gray-300">
                <SafeIcon icon={FiUsers} className="w-5 h-5 mr-3 text-primary-400" />
                <span>1,200 people attending</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Ticket Prices</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">General Admission</span>
                  <span className="font-semibold text-primary-400">€45</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">VIP</span>
                  <span className="font-semibold text-primary-400">€85</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Premium</span>
                  <span className="font-semibold text-primary-400">€120</span>
                </div>
              </div>
            </div>

            {/* Buy Tickets Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary-400 hover:bg-primary-500 text-black font-semibold py-4 rounded-lg transition-colors duration-300"
            >
              Buy Tickets Now
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;