import React,{useState,useEffect} from 'react';
import {useParams,Link} from 'react-router-dom';
import {motion} from 'framer-motion';
import {useTranslation} from 'react-i18next';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../components/common/SafeIcon';
import NavBar from '../components/layout/NavBar';
import Footer from '../components/Footer';
import {mockEvents} from '../data/mockData';
import {fetchEventById} from '../services/eventService';

const {FiArrowLeft,FiCalendar,FiMapPin,FiUsers,FiClock,FiUser,FiMusic}=FiIcons;

const ConcertDetail=()=> {
  const {t}=useTranslation();
  const {id}=useParams();
  const [event,setEvent]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=> {
    const loadEvent=async ()=> {
      setLoading(true);
      try {
        console.log('Loading event with ID:',id);
        // First try to get from Supabase
        const supabaseEvent=await fetchEventById(id);
        if (supabaseEvent) {
          console.log('Event loaded successfully:',supabaseEvent);
          setEvent(supabaseEvent);
        } else {
          console.log('Event not found in Supabase, checking mock data');
          // Fallback to mock data
          const mockEvent=mockEvents.find(e=> e.id===parseInt(id));
          setEvent(mockEvent);
        }
      } catch (error) {
        console.error("Error loading event:",error);
        // Fallback to mock data
        const mockEvent=mockEvents.find(e=> e.id===parseInt(id));
        setEvent(mockEvent);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  },[id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
        <NavBar />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading event details...</h1>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
        <NavBar />
        <div className="pt-24 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event not found</h1>
            <Link to="/concerts" className="text-primary-400 hover:text-primary-300">
              {t('concert.back')}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
      <NavBar />
      <div className="pt-24 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <motion.div
            initial={{opacity: 0,x: -20}}
            animate={{opacity: 1,x: 0}}
            className="mb-6"
          >
            <Link
              to="/concerts"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <SafeIcon icon={FiArrowLeft} className="w-5 h-5 mr-2" />
              {t('concert.back')}
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Event Image */}
            <motion.div
              initial={{opacity: 0,scale: 0.9}}
              animate={{opacity: 1,scale: 1}}
              transition={{duration: 0.5}}
              className="relative overflow-hidden rounded-xl"
            >
              <img
                src={event.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                alt={event.title}
                className="w-full h-80 md:h-96 object-cover"
                onError={(e)=> {
                  e.target.onerror=null;
                  e.target.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </motion.div>

            {/* Event Details */}
            <motion.div
              initial={{opacity: 0,y: 20}}
              animate={{opacity: 1,y: 0}}
              transition={{duration: 0.5,delay: 0.2}}
              className="space-y-6"
            >
              <div>
                {/* Category Badge */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-block px-3 py-1 bg-primary-400/20 text-primary-400 rounded-full text-sm font-medium capitalize">
                    {event.category}
                  </span>
                  {/* Genre Badge - Only show if genre exists */}
                  {event.genre && event.genre !== 'Transport' && (
                    <span className="inline-block px-3 py-1 bg-red-400/20 text-red-400 rounded-full text-sm font-medium">
                      {event.genre}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {event.title}
                </h1>
                <p className="text-gray-300 leading-relaxed">
                  {event.description || 'Experience an unforgettable night of music and entertainment. Join us for this spectacular event that promises to deliver amazing performances and create lasting memories.'}
                </p>
              </div>

              {/* Event Info */}
              <div className="space-y-4">
                {/* Artist - Show only if artist exists and is not N/A */}
                {event.artist && event.artist !== 'N/A' && (
                  <div className="flex items-center text-gray-300">
                    <SafeIcon icon={FiUser} className="w-5 h-5 mr-3 text-primary-400" />
                    <span>{event.artist}</span>
                  </div>
                )}

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
                  <span>{t('concert.doors')} 8:00 PM</span>
                </div>

                <div className="flex items-center text-gray-300">
                  <SafeIcon icon={FiUsers} className="w-5 h-5 mr-3 text-primary-400" />
                  <span>1,200 {t('concert.attending')}</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{t('concert.prices')}</h3>
                <div className="space-y-3">
                  {/* If event has ticket types from Supabase, use those */}
                  {event.price_book && Object.keys(event.price_book).length > 0 ? (
                    Object.entries(event.price_book).map(([categoryId,price],index)=> (
                      <div key={categoryId} className="flex justify-between items-center">
                        <span className="text-gray-300">{categoryId}</span>
                        <span className="font-semibold text-primary-400">€{price}</span>
                      </div>
                    ))
                  ) : (
                    // Otherwise use static pricing
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">{t('concert.general')}</span>
                        <span className="font-semibold text-primary-400">€45</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">{t('concert.vip')}</span>
                        <span className="font-semibold text-primary-400">€85</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">{t('concert.premium')}</span>
                        <span className="font-semibold text-primary-400">€120</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Buy Tickets Button */}
              <Link to={`/seat-selection/${event.id}`}>
                <motion.button
                  whileTap={{scale: 0.98}}
                  className="w-full bg-primary-400 hover:bg-primary-500 text-black font-semibold py-4 rounded-lg transition-colors duration-300"
                >
                  {t('concert.buyTickets')}
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ConcertDetail;