import supabase from '../lib/supabase';
import { getSafeStatus } from '../constants/seatStatus';

// Fetch seat map data (event, venue, seat statuses)
export const fetchSeatMapData = async (eventId) => {
  try {
    console.log('Fetching seat map data for event:', eventId);
    
    // First fetch the event
    const { data: event, error: eventError } = await supabase
      .from('events_fanaticka_7a3x9d')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (eventError) {
      console.error('Error fetching event:', eventError);
      throw new Error('Failed to fetch event data');
    }

    if (!event) {
      throw new Error('Event not found');
    }
    
    console.log('Event fetched successfully:', event);
    
    // If event has a venue_id, fetch the venue separately
    let venue = null;
    if (event.venue_id) {
      const { data: venueData, error: venueError } = await supabase
        .from('venues_fanaticka_7a3x9d')
        .select('*')
        .eq('id', event.venue_id)
        .single();
        
      if (venueError) {
        console.error('Error fetching venue:', venueError);
        // Don't throw here, we'll proceed with a null venue
      } else {
        venue = venueData;
        
        // Process venue canvas_data
        if (venue && venue.canvas_data) {
          // Parse canvas_data if it's a string
          if (typeof venue.canvas_data === 'string') {
            try {
              venue.canvas_data = JSON.parse(venue.canvas_data);
            } catch (e) {
              console.error('Error parsing venue canvas_data:', e);
              venue.canvas_data = { elements: [], categories: {} };
            }
          }
          
          // Ensure required properties exist
          if (!venue.canvas_data.elements) venue.canvas_data.elements = [];
          if (!venue.canvas_data.categories) venue.canvas_data.categories = {};
        } else {
          // Initialize empty canvas data if none exists
          venue.canvas_data = { elements: [], categories: {} };
        }
      }
    }
    
    // Fetch seat statuses for the event
    const { data: seats, error: seatsError } = await supabase
      .from('event_seats_fanaticka_7a3x9d')
      .select('*')
      .eq('event_id', eventId);
      
    if (seatsError) {
      console.error('Error fetching seats:', seatsError);
      // Continue with empty seat statuses
    }
    
    // Convert seat statuses to a lookup object
    const seatStatuses = {};
    (seats || []).forEach(seat => {
      seatStatuses[seat.seat_id] = {
        status: getSafeStatus(seat.status), // Use the safe status helper
        section: seat.section,
        row: seat.row,
        updatedAt: seat.updated_at
      };
    });
    
    console.log('Seat map data loaded successfully:', {
      event: event.id,
      venue: venue?.id || 'none',
      seatCount: seats?.length || 0
    });
    
    return {
      event,
      venue,
      seatStatuses
    };
  } catch (error) {
    console.error('Error in fetchSeatMapData:', error);
    throw error;
  }
};

// Hold a seat
export const holdSeat = async (eventId, seatId) => {
  try {
    // Convert seatId to string to ensure consistency
    const seatIdStr = String(seatId);
    console.log(`Attempting to hold seat ${seatIdStr} for event ${eventId}`);
    
    const { data, error } = await supabase
      .from('event_seats_fanaticka_7a3x9d')
      .update({ 
        status: 'held', // Always use 'held', not 'hold'
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('seat_id', seatIdStr)
      .select('seat_id, status');
      
    if (error) {
      console.error('Error holding seat:', error);
      return false;
    }
    
    console.log('Seat hold successful:', data);
    return true;
  } catch (error) {
    console.error('Error in holdSeat:', error);
    return false;
  }
};

// Release seats
export const releaseSeats = async (eventId, seatIds) => {
  try {
    // Convert all seatIds to strings
    const seatIdStrings = seatIds.map(id => String(id));
    console.log(`Releasing seats for event ${eventId}:`, seatIdStrings);
    
    const { error } = await supabase
      .from('event_seats_fanaticka_7a3x9d')
      .update({ 
        status: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .in('seat_id', seatIdStrings);
      
    if (error) {
      console.error('Error releasing seats:', error);
      return false;
    }
    
    console.log('Seats released successfully');
    return true;
  } catch (error) {
    console.error('Error in releaseSeats:', error);
    return false;
  }
};

// Initialize Realtime subscription
export const initializeSeatMapRealtime = (eventId, onSeatStatusChange, onPriceBookUpdate) => {
  console.log(`Setting up Realtime subscriptions for event ${eventId}`);
  
  // Subscribe to event price_book updates
  const eventChannel = supabase
    .channel(`event-${eventId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'events_fanaticka_7a3x9d',
      filter: `id=eq.${eventId}`
    }, payload => {
      console.log('Event update received:', payload);
      if (payload.new && payload.new.price_book) {
        onPriceBookUpdate(payload.new.price_book);
      }
    })
    .subscribe();
    
  // Subscribe to seat status changes
  const seatsChannel = supabase
    .channel(`seats-${eventId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'event_seats_fanaticka_7a3x9d',
      filter: `event_id=eq.${eventId}`
    }, payload => {
      console.log('Seat status change received:', payload);
      if (payload.new) {
        const seatId = String(payload.new.seat_id);
        onSeatStatusChange(seatId, getSafeStatus(payload.new.status));
      }
    })
    .subscribe();
    
  // Return cleanup function
  return () => {
    console.log('Cleaning up Realtime subscriptions');
    supabase.removeChannel(eventChannel);
    supabase.removeChannel(seatsChannel);
  };
};

// Clean up expired holds
export const cleanupExpiredReservations = async () => {
  try {
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    const { error } = await supabase
      .from('event_seats_fanaticka_7a3x9d')
      .update({ 
        status: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'held')
      .lt('updated_at', tenMinutesAgo.toISOString());
      
    if (error) {
      console.error('Error cleaning up expired holds:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in cleanupExpiredReservations:', error);
    return false;
  }
};