import React,{useState,useEffect,useRef} from 'react';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../components/common/SafeIcon';
import AdminNavBar from '../../components/admin/AdminNavBar';
import EventWizard from '../../components/admin/EventWizard';
import {fetchEvents,createEvent,updateEvent,deleteEvent,testDatabaseConnection} from '../../services/eventService';
import {fetchVenues} from '../../services/venueService';

const {FiPlus,FiSearch,FiEdit,FiTrash2,FiCheck,FiX,FiKey,FiImage,FiMapPin,FiAlertCircle,FiBarChart3} = FiIcons;

const AdminConcerts=()=> {
  const navigate = useNavigate();
  const [searchTerm,setSearchTerm]=useState('');
  const [showWizard,setShowWizard]=useState(false);
  const [events,setEvents]=useState([]);
  const [venues,setVenues]=useState([]);
  const [loading,setLoading]=useState(true);
  const [isEditing,setIsEditing]=useState(false);
  const [currentEventId,setCurrentEventId]=useState(null);
  const [currentEvent,setCurrentEvent]=useState(null);
  const [wizardSaving,setWizardSaving]=useState(false);
  const [error,setError]=useState('');
  const [dbConnectionStatus,setDbConnectionStatus]=useState('checking');

  useEffect(()=> {
    const loadData=async ()=> {
      setLoading(true);
      try {
        // Check database connection
        console.log('Testing database connection...');
        setDbConnectionStatus('checking');
        const connectionOk=await testDatabaseConnection();
        if (!connectionOk) {
          setDbConnectionStatus('failed');
          setError('Database connection failed. Please check your Supabase configuration.');
          return;
        }

        setDbConnectionStatus('connected');
        console.log('Database connection successful');

        // Load events and venues
        const [supabaseEvents,venueData]=await Promise.all([
          fetchEvents(),
          fetchVenues()
        ]);

        console.log('Loaded events:',supabaseEvents?.length || 0);
        console.log('Loaded venues:',venueData?.length || 0);

        setVenues(venueData || []);

        if (supabaseEvents && supabaseEvents.length > 0) {
          const formattedEvents=supabaseEvents.map(event=> ({
            ...event,
            id: event.id,
            title: event.title,
            date: event.date,
            location: event.location,
            category: event.category,
            image: event.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
          }));
          setEvents(formattedEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error("Error loading data:",error);
        setDbConnectionStatus('failed');
        setError(`Failed to load data: ${error.message}`);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  },[]);

  // Filter events based on search term
  const filteredEvents=events.filter(event=>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEvent=()=> {
    setIsEditing(false);
    setCurrentEventId(null);
    setCurrentEvent(null);
    setError('');
    setShowWizard(true);
  };

  const handleEditEvent=(event)=> {
    setIsEditing(true);
    setCurrentEventId(event.id);
    setCurrentEvent(event);
    setError('');
    setShowWizard(true);
  };

  const handleViewEventDashboard = (eventId) => {
    navigate(`/admin/events/${eventId}/dashboard`);
  };

  const handleSaveEvent=async (eventData)=> {
    setWizardSaving(true);
    setError('');

    try {
      console.log('Saving event data:',eventData);
      let result;

      if (isEditing && currentEventId) {
        // Update existing event
        result=await updateEvent(currentEventId,eventData);
        if (result) {
          setEvents(events.map(e=> e.id===currentEventId ? result : e));
        }
      } else {
        // Create new event
        result=await createEvent(eventData);
        if (result) {
          setEvents([result,...events]);
        }
      }

      if (result) {
        setShowWizard(false);
        setIsEditing(false);
        setCurrentEventId(null);
        setCurrentEvent(null);
        console.log('Event saved successfully:',result);
        return result; // Return for navigation
      } else {
        throw new Error('No result returned from save operation');
      }
    } catch (error) {
      console.error('Error saving event:',error);
      // Don't close wizard on error - let user see the error and try again
      if (error.status===422 && error.details) {
        // Validation errors - these will be shown in the wizard
        throw error;
      } else {
        setError(error.message || 'Failed to save event. Please try again.');
        throw error;
      }
    } finally {
      setWizardSaving(false);
    }
  };

  const handleCancelWizard=()=> {
    setShowWizard(false);
    setIsEditing(false);
    setCurrentEventId(null);
    setCurrentEvent(null);
    setError('');
  };

  const handleDelete=async (id)=> {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const success=await deleteEvent(id);
        if (success) {
          setEvents(events.filter(event=> event.id !==id));
        }
      } catch (error) {
        console.error("Error deleting event:",error);
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  // Connection status indicator
  const ConnectionStatus=()=> (
    <div className="flex items-center space-x-2 text-sm">
      {dbConnectionStatus==='checking' && (
        <>
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-yellow-500">Checking connection...</span>
        </>
      )}
      {dbConnectionStatus==='connected' && (
        <>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-green-500">Connected</span>
        </>
      )}
      {dbConnectionStatus==='failed' && (
        <>
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-red-500">Connection failed</span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <AdminNavBar />
      <div className="ml-0 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold">Concert Management</h1>
              <ConnectionStatus />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search concerts..."
                  value={searchTerm}
                  onChange={(e)=> setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg w-full sm:w-64 focus:outline-none focus:border-primary-400"
                />
              </div>
              <button
                onClick={handleCreateEvent}
                disabled={dbConnectionStatus !=='connected'}
                className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                  dbConnectionStatus==='connected'
                    ? 'bg-primary-400 hover:bg-primary-500 text-black'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <SafeIcon icon={FiPlus} className="mr-2" />
                New Concert
              </button>
            </div>
          </div>

          {/* Database Connection Error */}
          {dbConnectionStatus==='failed' && (
            <div className="mb-6 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center">
              <SafeIcon icon={FiAlertCircle} className="mr-2" />
              <div>
                <strong>Database Connection Failed</strong>
                <p className="text-sm mt-1">Please check your Supabase configuration in src/lib/supabase.js</p>
              </div>
            </div>
          )}

          {/* General Error */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Concerts Table */}
          <div className="bg-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-700/50">
                    <th className="text-left py-3 px-4 font-medium">Title</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Location</th>
                    <th className="text-left py-3 px-4 font-medium">Venue</th>
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-left py-3 px-4 font-medium">Pricing</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center">
                        <div className="flex justify-center">
                          <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="mt-2 text-gray-400">Loading events...</div>
                      </td>
                    </tr>
                  ) : dbConnectionStatus==='failed' ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-red-400">
                        Cannot load events: Database connection failed
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event)=> {
                      const venue=venues.find(v=> v.id===event.venue_id);
                      const priceBook=event.price_book || {};
                      const prices=Object.values(priceBook).filter(p=> p > 0);
                      const priceRange=prices.length > 0
                        ? prices.length===1
                          ? `€${prices[0]}`
                          : `€${Math.min(...prices)}-${Math.max(...prices)}`
                        : 'No prices set';

                      return (
                        <tr
                          key={event.id}
                          className="border-t border-zinc-700 hover:bg-zinc-700/30 cursor-pointer transition-colors"
                          onClick={() => handleViewEventDashboard(event.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded overflow-hidden mr-3">
                                <img
                                  src={event.image}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                  onError={(e)=> {
                                    e.target.onerror=null;
                                    e.target.src='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                                  }}
                                />
                              </div>
                              <div>
                                <span className="font-medium">{event.title}</span>
                                <div className="text-xs text-gray-500">ID: {event.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{event.date}</td>
                          <td className="py-3 px-4 text-gray-300">{event.location}</td>
                          <td className="py-3 px-4">
                            {venue ? (
                              <div className="flex items-center">
                                <SafeIcon icon={FiMapPin} className="w-4 h-4 mr-1 text-primary-400" />
                                <span className="text-primary-400">{venue.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">General Admission</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-zinc-700 text-primary-400 rounded-full text-xs capitalize">
                              {event.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-300">{priceRange}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                className="p-2 hover:bg-zinc-600 rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewEventDashboard(event.id);
                                }}
                                title="View Dashboard"
                              >
                                <SafeIcon icon={FiBarChart3} className="w-5 h-5 text-primary-400" />
                              </button>
                              <button
                                className="p-2 hover:bg-zinc-600 rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEvent(event);
                                }}
                                title="Edit Event"
                              >
                                <SafeIcon icon={FiEdit} className="w-5 h-5 text-blue-400" />
                              </button>
                              <button
                                className="p-2 hover:bg-zinc-600 rounded-lg transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(event.id);
                                }}
                                title="Delete Event"
                              >
                                <SafeIcon icon={FiTrash2} className="w-5 h-5 text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {!loading && dbConnectionStatus==='connected' && filteredEvents.length===0 && (
              <div className="py-8 text-center text-gray-400">
                No concerts found matching your search criteria
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Wizard */}
      {showWizard && (
        <EventWizard
          onSave={handleSaveEvent}
          onCancel={handleCancelWizard}
          saving={wizardSaving}
          eventToEdit={isEditing ? currentEvent : null}
        />
      )}
    </div>
  );
};

export default AdminConcerts;