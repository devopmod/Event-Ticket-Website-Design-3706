import supabase from '../lib/supabase';
import {initializeZonesTables, createZone} from './zoneSeatService';

// Table names
const EVENTS_TABLE = 'events_fanaticka_7a3x9d';
const VENUES_TABLE = 'venues_fanaticka_7a3x9d';
const EVENT_SEATS_TABLE = 'event_seats_fanaticka_7a3x9d';

// Seat status constants
export const SEAT_STATUS = {
  FREE: 'free',
  HELD: 'held',
  SOLD: 'sold'
};

export const getStatusColor = (status) => {
  switch (status) {
    case SEAT_STATUS.FREE: return '#3B82F6'; // Blue
    case SEAT_STATUS.HELD: return '#F59E0B'; // Amber
    case SEAT_STATUS.SOLD: return '#6B7280'; // Gray
    default: return '#9CA3AF'; // Default gray
  }
};

// Fetch all events
export const fetchEvents = async () => {
  try {
    const {data, error} = await supabase
      .from(EVENTS_TABLE)
      .select(`
        *,
        venue:${VENUES_TABLE}(id, name, description)
      `)
      .order('event_date', {ascending: true});

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchEvents:', error);
    return [];
  }
};

// Fetch a single event by ID
export const fetchEventById = async (id) => {
  try {
    const {data, error} = await supabase
      .from(EVENTS_TABLE)
      .select(`
        *,
        venue:${VENUES_TABLE}(id, name, description, canvas_data)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchEventById:', error);
    return null;
  }
};

// Create a new event
export const createEvent = async (eventData) => {
  try {
    console.log('Creating event with data:', eventData);
    
    // Format data for API: convert priceBook to price_book if needed
    const formattedData = {...eventData};
    if (formattedData.priceBook) {
      formattedData.price_book = formattedData.priceBook;
      delete formattedData.priceBook;
    }

    const {data, error} = await supabase
      .from(EVENTS_TABLE)
      .insert([formattedData])
      .select();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    // If event has a venue, generate seats
    if (data && data[0] && data[0].venue_id) {
      await generateInitialSeatStatuses(data[0].id, data[0].venue_id);
    }

    return data?.[0];
  } catch (error) {
    console.error('Error in createEvent:', error);
    throw error;
  }
};

// Update an existing event
export const updateEvent = async (id, eventData) => {
  try {
    // Format data for API: convert priceBook to price_book if needed
    const formattedData = {...eventData};
    if (formattedData.priceBook) {
      formattedData.price_book = formattedData.priceBook;
      delete formattedData.priceBook;
    }
    
    const {data, error} = await supabase
      .from(EVENTS_TABLE)
      .update(formattedData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    return data?.[0];
  } catch (error) {
    console.error('Error in updateEvent:', error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (id) => {
  try {
    const {error} = await supabase
      .from(EVENTS_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    return false;
  }
};

// Update event price book
export const updateEventPriceBook = async (id, priceBook) => {
  try {
    const {data, error} = await supabase
      .from(EVENTS_TABLE)
      .update({price_book: priceBook})
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating price book:', error);
      throw error;
    }

    return data?.[0];
  } catch (error) {
    console.error('Error in updateEventPriceBook:', error);
    throw error;
  }
};

// Get event statistics
export const getEventStatistics = async (eventId) => {
  try {
    // Get seat counts
    const {data: seats, error: seatsError} = await supabase
      .from(EVENT_SEATS_TABLE)
      .select('status, total_capacity')
      .eq('event_id', eventId);

    if (seatsError) {
      console.error('Error fetching seats:', seatsError);
      throw seatsError;
    }

    // Calculate statistics
    const totalSeats = seats.reduce((sum, seat) => sum + (seat.total_capacity || 1), 0);
    const soldSeats = seats.filter(seat => seat.status === 'sold').length;
    const heldSeats = seats.filter(seat => seat.status === 'held').length;
    const freeSeats = seats.filter(seat => seat.status === 'free').length;

    // Get event details for price calculation
    const {data: event, error: eventError} = await supabase
      .from(EVENTS_TABLE)
      .select('price_book')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event for statistics:', eventError);
      throw eventError;
    }

    // Calculate estimated revenue based on price book
    const priceBook = event?.price_book || {};
    const prices = Object.values(priceBook).filter(p => p > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
    const estimatedRevenue = soldSeats * averagePrice;

    return {
      totalSeats,
      soldSeats,
      heldSeats,
      freeSeats,
      occupancyRate: totalSeats > 0 ? Math.round((soldSeats / totalSeats) * 100) : 0,
      averagePrice,
      estimatedRevenue,
      todaysSales: Math.round(estimatedRevenue * 0.15), // Mock data for today's sales
      salesGrowth: '+12%' // Mock growth rate
    };
  } catch (error) {
    console.error('Error in getEventStatistics:', error);
    return null;
  }
};

// Initialize Realtime subscription for events
export const initializeRealtimeSubscription = (eventId, onPriceBookUpdate, onSeatStatusChange) => {
  console.log(`Setting up Realtime subscriptions for event ${eventId}`);

  // Subscribe to event price_book updates
  const eventChannel = supabase
    .channel(`event-${eventId}`)
    .on('postgres_changes', 
      {
        event: 'UPDATE',
        schema: 'public',
        table: EVENTS_TABLE,
        filter: `id=eq.${eventId}`
      },
      payload => {
        console.log('Event update received:', payload);
        if (payload.new && payload.new.price_book) {
          onPriceBookUpdate(payload.new.price_book);
        }
      })
    .subscribe();

  // Subscribe to seat status changes
  const seatsChannel = supabase
    .channel(`event-seats-${eventId}`)
    .on('postgres_changes', 
      {
        event: '*',
        schema: 'public',
        table: EVENT_SEATS_TABLE,
        filter: `event_id=eq.${eventId}`
      },
      payload => {
        console.log('Seat status change received:', payload);
        onSeatStatusChange(payload);
      })
    .subscribe();

  // Return cleanup function
  return () => {
    console.log('Cleaning up Realtime subscriptions');
    supabase.removeChannel(eventChannel);
    supabase.removeChannel(seatsChannel);
  };
};

// Generate initial seat statuses
export const generateInitialSeatStatuses = async (eventId, venueId) => {
  try {
    // First initialize zones tables if needed
    await initializeZonesTables();

    // Get venue data...
    const {data: venue, error: venueError} = await supabase
      .from(VENUES_TABLE)
      .select('canvas_data')
      .eq('id', venueId)
      .single();

    if (venueError) throw venueError;

    // Parse elements
    let elements = [];
    try {
      const canvasData = typeof venue.canvas_data === 'string' ? JSON.parse(venue.canvas_data) : venue.canvas_data;
      elements = canvasData?.elements || [];
    } catch (e) {
      console.error('Error parsing canvas_data:', e);
      return false;
    }

    // Process elements
    for (const element of elements) {
      if (element.type === 'seat') {
        // Handle individual seats
        await supabase
          .from(EVENT_SEATS_TABLE)
          .insert([{
            event_id: eventId,
            seat_id: String(element.id),
            status: 'free',
            section: element.section || element.categoryId || 'A',
            row: parseInt(element.row) || 1,
            is_bookable: element.is_bookable !== false,
            element_type: 'seat',
            total_capacity: 1,
            available_capacity: 1
          }]);
      } else if (element.type === 'section' || element.type === 'polygon') {
        // For sections and polygons with capacity > 1, create a zone
        const capacity = element.capacity || 1;
        if (capacity > 1) {
          console.log(`Creating zone for ${element.type} with capacity ${capacity}`);
          await createZone(eventId, {
            name: element.label || `${element.type}-${element.id}`,
            capacity: capacity,
            uiShape: {
              type: element.type,
              coordinates: element.type === 'polygon' ? element.points : {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height
              },
              categoryId: element.categoryId
            }
          });
        } else {
          // For capacity 1, create a regular seat entry
          await supabase
            .from(EVENT_SEATS_TABLE)
            .insert([{
              event_id: eventId,
              seat_id: String(element.id),
              status: 'free',
              section: element.section || element.categoryId || 'A',
              row: parseInt(element.row) || 1,
              is_bookable: element.is_bookable !== false,
              element_type: element.type,
              total_capacity: 1,
              available_capacity: 1
            }]);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error generating seat statuses:', error);
    return false;
  }
};

// Get event seat statuses
export const getEventSeatStatuses = async (eventId) => {
  try {
    const {data, error} = await supabase
      .from(EVENT_SEATS_TABLE)
      .select('*')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching seat statuses:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEventSeatStatuses:', error);
    return [];
  }
};

// Update a single seat status
export const updateSeatStatus = async (eventId, seatId, status) => {
  try {
    const {data, error} = await supabase
      .from(EVENT_SEATS_TABLE)
      .update({status})
      .eq('event_id', eventId)
      .eq('seat_id', seatId)
      .select();

    if (error) {
      console.error('Error updating seat status:', error);
      throw error;
    }

    return data?.[0];
  } catch (error) {
    console.error('Error in updateSeatStatus:', error);
    throw error;
  }
};

// Bulk update seat statuses
export const bulkUpdateSeatStatuses = async (eventId, updates) => {
  try {
    // We'll use a transaction for this in a real implementation
    // For now, we'll just do individual updates
    for (const update of updates) {
      await updateSeatStatus(eventId, update.seatId, update.status);
    }
    return true;
  } catch (error) {
    console.error('Error in bulkUpdateSeatStatuses:', error);
    throw error;
  }
};

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    const {data, error} = await supabase.from(EVENTS_TABLE).select('id').limit(1);
    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
};

// Regenerate seats for events using a specific venue
export const regenerateSeatsForVenue = async (venueId) => {
  try {
    // Get all events that use this venue
    const {data: events, error: eventsError} = await supabase
      .from(EVENTS_TABLE)
      .select('id')
      .eq('venue_id', venueId);

    if (eventsError) {
      console.error('Error fetching events for venue:', eventsError);
      return false;
    }

    if (!events || events.length === 0) {
      console.log('No events found for this venue');
      return true; // No events to regenerate
    }

    // For each event, regenerate seats
    for (const event of events) {
      await regenerateEventSeats(event.id);
    }

    return true;
  } catch (error) {
    console.error('Error regenerating seats for venue:', error);
    return false;
  }
};

// Regenerate seats for a specific event
export const regenerateEventSeats = async (eventId) => {
  try {
    // First, get the event to find its venue
    const {data: event, error: eventError} = await supabase
      .from(EVENTS_TABLE)
      .select('venue_id')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      return false;
    }

    if (!event?.venue_id) {
      console.error('Event has no venue');
      return false;
    }

    // Delete existing seats
    const {error: deleteError} = await supabase
      .from(EVENT_SEATS_TABLE)
      .delete()
      .eq('event_id', eventId);

    if (deleteError) {
      console.error('Error deleting existing seats:', deleteError);
      return false;
    }

    // Generate new seats
    const success = await generateInitialSeatStatuses(eventId, event.venue_id);
    return success;
  } catch (error) {
    console.error('Error regenerating event seats:', error);
    return false;
  }
};