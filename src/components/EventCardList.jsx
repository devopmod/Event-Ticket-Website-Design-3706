import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiCalendar, FiMapPin, FiUser, FiMusic } = FiIcons;

const EventCardList = ({ events, loading = false }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-zinc-700 h-48 rounded-lg mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
              <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🎫</div>
        <h3 className="text-xl font-semibold text-white mb-2">{t('concerts.noEvents')}</h3>
        <p className="text-gray-400">{t('concerts.tryAdjusting')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <div key={event.id}>
          <Link to={`/event/${event.id}`}>
            <div className="bg-zinc-800/30 rounded-lg overflow-hidden hover:bg-zinc-800/50 transition-all duration-300 group">
              {/* Event Image */}
              <div className="relative overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-primary-400/90 text-black text-xs font-medium rounded-full capitalize">
                    {event.category}
                  </span>
                </div>
                
                {/* Genre Badge */}
                {event.genre && event.genre !== 'N/A' && event.genre !== 'Transport' && (
                  <div className="absolute top-3 left-[90px]">
                    <span className="px-2 py-1 bg-red-400/90 text-black text-xs font-medium rounded-full">
                      {event.genre}
                    </span>
                  </div>
                )}
                
                {/* Price Badge */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-black/70 text-primary-400 text-sm font-semibold rounded-full">
                    {t('common.from')} €45
                  </span>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-3 leading-tight group-hover:text-primary-400 transition-colors line-clamp-2">
                  {event.title}
                </h3>
                
                <div className="space-y-2">
                  {event.artist && event.artist !== 'N/A' && (
                    <div className="flex items-center text-gray-400 text-sm">
                      <SafeIcon icon={FiUser} className="w-4 h-4 mr-2" />
                      <span>{event.artist}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-400 text-sm">
                    <SafeIcon icon={FiCalendar} className="w-4 h-4 mr-2" />
                    <span>{event.date}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-400 text-sm">
                    <SafeIcon icon={FiMapPin} className="w-4 h-4 mr-2" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {/* Book Now Button */}
                <button className="w-full mt-4 bg-primary-400 hover:bg-primary-500 text-black font-medium py-2 px-4 rounded-lg transition-colors duration-300">
                  {t('concerts.bookNow')}
                </button>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default EventCardList;