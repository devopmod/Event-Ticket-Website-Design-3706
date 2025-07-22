import supabase from '../lib/supabase';
import { regenerateSeatsForVenue } from './eventService';

// Table names
const VENUES_TABLE = 'venues_fanaticka_7a3x9d';
const VENUE_SEATS_TABLE = 'venue_seats_fanaticka_7a3x9d';
const SEAT_RESERVATIONS_TABLE = 'seat_reservations_fanaticka_7a3x9d';
const SEAT_PURCHASES_TABLE = 'seat_purchases_fanaticka_7a3x9d';
const EVENTS_TABLE = 'events_fanaticka_7a3x9d';
const EVENT_SEATS_TABLE = 'event_seats_fanaticka_7a3x9d';

// НОВАЯ функция: Получить количество мест в venue с учетом capacity
export const getVenueSeatsCount = async (venueId) => {
  try {
    console.log('🔍 Calculating seats count for venue:', venueId);
    const { data: venue, error } = await supabase
      .from(VENUES_TABLE)
      .select('canvas_data')
      .eq('id', venueId)
      .single();
      
    if (error || !venue) {
      console.error('❌ Error fetching venue:', error);
      return {
        total: 0,
        byType: { seat: 0, section: 0, polygon: 0 },
        byCategory: {},
        elements: 0
      };
    }

    // Parse canvas data
    let elements = [];
    try {
      const canvasData = typeof venue.canvas_data === 'string'
        ? JSON.parse(venue.canvas_data)
        : venue.canvas_data;
      elements = canvasData?.elements || [];
    } catch (e) {
      console.error('❌ Error parsing canvas_data:', e);
      return {
        total: 0,
        byType: { seat: 0, section: 0, polygon: 0 },
        byCategory: {},
        elements: 0
      };
    }

    // Calculate total seats including capacity
    const result = {
      total: 0,
      byType: { seat: 0, section: 0, polygon: 0 },
      byCategory: {},
      elements: elements.length,
      bookableElements: 0
    };
    
    elements.forEach(element => {
      if (['seat', 'polygon', 'section'].includes(element.type)) {
        // Count elements
        result.byType[element.type]++;
        
        // Check if bookable
        const isBookable = element.is_bookable !== false;
        if (isBookable) {
          result.bookableElements++;
          
          // Calculate capacity
          let capacity = 1;
          if ((element.type === 'polygon' || element.type === 'section') && element.capacity) {
            capacity = element.capacity;
          }
          
          result.total += capacity;
          
          // Count by category
          const categoryId = element.categoryId || 'UNCATEGORIZED';
          result.byCategory[categoryId] = (result.byCategory[categoryId] || 0) + capacity;
        }
      }
    });
    
    console.log('📊 Venue seats count:', result);
    return result;
  } catch (error) {
    console.error('❌ Error calculating venue seats count:', error);
    return {
      total: 0,
      byType: { seat: 0, section: 0, polygon: 0 },
      byCategory: {},
      elements: 0,
      bookableElements: 0
    };
  }
};

// НОВАЯ функция: Получить количество мест в БД для всех событий venue
export const getVenueSeatsCountInDB = async (venueId) => {
  try {
    console.log('🔍 Getting seats count from DB for venue:', venueId);
    
    // Get all events for this venue
    const { data: events, error: eventsError } = await supabase
      .from(EVENTS_TABLE)
      .select('id')
      .eq('venue_id', venueId);
      
    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
      return {};
    }
    
    if (!events || events.length === 0) {
      console.log('⚠️ No events found for venue');
      return {};
    }

    // Get seat counts for each event
    const eventSeatsCount = {};
    for (const event of events) {
      const { data: seats, error: seatsError } = await supabase
        .from(EVENT_SEATS_TABLE)
        .select('total_capacity')
        .eq('event_id', event.id);
        
      if (seatsError) {
        console.error('❌ Error fetching seats for event:', event.id, seatsError);
        eventSeatsCount[event.id] = 0;
      } else {
        const totalSeats = seats.reduce((sum, seat) => sum + (seat.total_capacity || 1), 0);
        eventSeatsCount[event.id] = totalSeats;
      }
    }
    
    console.log('📊 DB seats count by event:', eventSeatsCount);
    return eventSeatsCount;
  } catch (error) {
    console.error('❌ Error getting venue seats count from DB:', error);
    return {};
  }
};

// Venue management
export const fetchVenues = async () => {
  try {
    console.log('Fetching venues from table:', VENUES_TABLE);
    const { data, error } = await supabase
      .from(VENUES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error in fetchVenues:', error);
      throw error;
    }
    
    console.log('Venues fetched successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error fetching venues:', error);
    return [];
  }
};

export const fetchVenueById = async (id) => {
  try {
    console.log('Fetching venue by ID:', id);
    
    // Упрощенный запрос без FK constraints
    const { data, error } = await supabase
      .from(VENUES_TABLE)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching venue by ID:', error);
      throw error;
    }

    // Отдельно получаем seats если нужно
    if (data) {
      const { data: seats, error: seatsError } = await supabase
        .from(VENUE_SEATS_TABLE)
        .select('*')
        .eq('venue_id', id);
        
      if (!seatsError && seats) {
        data.seats = seats;
      }
    }
    
    console.log('Venue fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching venue:', error);
    return null;
  }
};

export const createVenue = async (venueData) => {
  try {
    console.log('Creating venue with data:', venueData);
    const { data, error } = await supabase
      .from(VENUES_TABLE)
      .insert([{
        ...venueData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
      
    if (error) {
      console.error('Error in createVenue:', error);
      throw error;
    }
    
    console.log('Venue created successfully:', data?.[0]);
    return data?.[0];
  } catch (error) {
    console.error('Error creating venue:', error);
    return null;
  }
};

// ОБНОВЛЕНО: Функция обновления venue с регенерацией мест
export const updateVenue = async (id, venueData) => {
  try {
    console.log('🔄 Updating venue:', id, 'with data:', venueData);
    const { data, error } = await supabase
      .from(VENUES_TABLE)
      .update({
        ...venueData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('❌ Error updating venue:', error);
      throw error;
    }
    
    console.log('✅ Venue updated successfully:', data?.[0]);
    
    // НОВОЕ: Регенерируем места для всех событий с этим venue
    console.log('🔄 Regenerating seats for all events with this venue...');
    const regenerationSuccess = await regenerateSeatsForVenue(id);
    
    if (regenerationSuccess) {
      console.log('✅ Successfully regenerated seats for all events');
    } else {
      console.warn('⚠️ Failed to regenerate seats for some events');
    }
    
    return data?.[0];
  } catch (error) {
    console.error('❌ Error updating venue:', error);
    return null;
  }
};

export const deleteVenue = async (id) => {
  try {
    console.log('Deleting venue:', id);
    const { error } = await supabase
      .from(VENUES_TABLE)
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting venue:', error);
      throw error;
    }
    
    console.log('Venue deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting venue:', error);
    return false;
  }
};

// Seat management
export const createVenueSeats = async (venueId, seats) => {
  try {
    console.log('Creating venue seats for venue:', venueId, 'seats:', seats?.length || 0);
    
    // Проверим, существует ли таблица перед вставкой
    const { count, error: checkError } = await supabase
      .from(VENUES_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('id', venueId);
      
    if (checkError) {
      console.error('Error checking venue existence:', checkError);
      throw checkError;
    }
    
    if (count === 0) {
      throw new Error(`Venue with id ${venueId} does not exist`);
    }

    // Если нет мест для вставки, просто вернем пустой массив
    if (!seats || seats.length === 0) {
      console.log('No seats to create');
      return [];
    }
    
    const seatsData = seats.map(seat => ({
      venue_id: venueId,
      seat_number: seat.seat_number || `Seat-${Date.now()}`,
      section: seat.section || 'A',
      row_number: seat.row_number || 1,
      x_position: seat.x_position,
      y_position: seat.y_position,
      price: seat.price || 45,
      seat_type: seat.seat_type || 'regular',
      is_available: true
    }));
    
    const { data, error } = await supabase
      .from(VENUE_SEATS_TABLE)
      .insert(seatsData)
      .select();
      
    if (error) {
      console.error('Error in createVenueSeats:', error);
      throw error;
    }
    
    console.log('Venue seats created successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error creating venue seats:', error);
    return [];
  }
};

export const updateVenueSeats = async (venueId, seats) => {
  try {
    console.log('Updating venue seats for venue:', venueId, 'seats:', seats?.length || 0);
    
    // Проверяем, существует ли таблица
    const { count, error: checkError } = await supabase
      .from(VENUES_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('id', venueId);
      
    if (checkError) {
      console.error('Error checking venue existence:', checkError);
      throw checkError;
    }
    
    if (count === 0) {
      console.error(`Venue with id ${venueId} does not exist`);
      throw new Error(`Venue with id ${venueId} does not exist`);
    }

    // Если нет мест для обновления, просто вернем пустой массив
    if (!seats || seats.length === 0) {
      console.log('No seats to update, returning empty array');
      return [];
    }
    
    try {
      // Удаляем существующие места для этого venue
      const { error: deleteError } = await supabase
        .from(VENUE_SEATS_TABLE)
        .delete()
        .eq('venue_id', venueId);
        
      if (deleteError) {
        console.error('Error deleting existing seats:', deleteError);
        throw deleteError;
      }
      
      console.log(`Successfully deleted existing seats for venue ${venueId}`);
      
      // Создаем новые места
      return await createVenueSeats(venueId, seats);
    } catch (error) {
      console.error('Error in updateVenueSeats transaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating venue seats:', error);
    return [];
  }
};

// Seat reservations (для временного удержания мест)
export const reserveSeats = async (eventId, seatIds, customerEmail) => {
  try {
    console.log('Reserving seats for event:', eventId, 'seats:', seatIds);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 минут
    
    const reservationsData = seatIds.map(seatId => ({
      event_id: eventId,
      seat_id: seatId,
      customer_email: customerEmail,
      expires_at: expiresAt.toISOString()
    }));
    
    const { data, error } = await supabase
      .from(SEAT_RESERVATIONS_TABLE)
      .insert(reservationsData)
      .select();
      
    if (error) {
      console.error('Error reserving seats:', error);
      throw error;
    }
    
    console.log('Seats reserved successfully:', data?.length || 0);
    return data;
  } catch (error) {
    console.error('Error reserving seats:', error);
    return [];
  }
};

export const releaseSeats = async (eventId, seatIds) => {
  try {
    console.log('Releasing seats for event:', eventId, 'seats:', seatIds);
    const { error } = await supabase
      .from(SEAT_RESERVATIONS_TABLE)
      .delete()
      .eq('event_id', eventId)
      .in('seat_id', seatIds);
      
    if (error) {
      console.error('Error releasing seats:', error);
      throw error;
    }
    
    console.log('Seats released successfully');
    return true;
  } catch (error) {
    console.error('Error releasing seats:', error);
    return false;
  }
};

// Purchase seats (финальная покупка)
export const purchaseSeats = async (eventId, seatIds, customerData, paymentData) => {
  try {
    console.log('Purchasing seats for event:', eventId, 'seats:', seatIds);
    
    // First, remove reservations
    await supabase
      .from(SEAT_RESERVATIONS_TABLE)
      .delete()
      .eq('event_id', eventId)
      .in('seat_id', seatIds);

    // Create purchases
    const purchasesData = seatIds.map(seatId => ({
      event_id: eventId,
      seat_id: seatId,
      customer_name: customerData.name,
      customer_email: customerData.email,
      customer_phone: customerData.phone,
      purchase_price: paymentData.amount / seatIds.length, // Distribute total amount
      payment_method: paymentData.method,
      purchased_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from(SEAT_PURCHASES_TABLE)
      .insert(purchasesData)
      .select();
      
    if (error) {
      console.error('Error purchasing seats:', error);
      throw error;
    }
    
    console.log('Seats purchased successfully:', data?.length || 0);
    return data;
  } catch (error) {
    console.error('Error purchasing seats:', error);
    return [];
  }
};

// Get seat availability for event
export const getSeatAvailability = async (eventId) => {
  try {
    console.log('Getting seat availability for event:', eventId);
    
    // Упрощенный запрос - сначала получаем событие
    const { data: event, error: eventError } = await supabase
      .from(EVENTS_TABLE)
      .select('venue_id')
      .eq('id', eventId)
      .single();
      
    if (eventError) {
      console.error('Error getting event:', eventError);
      throw eventError;
    }
    
    if (!event?.venue_id) {
      console.log('Event has no venue');
      return { seats: [], reservations: [], purchases: [] };
    }

    // Получаем места venue
    const { data: seats, error: seatsError } = await supabase
      .from(VENUE_SEATS_TABLE)
      .select('*')
      .eq('venue_id', event.venue_id);
      
    if (seatsError) {
      console.error('Error getting seats:', seatsError);
    }

    // Get reservations (not expired)
    const { data: reservations, error: reservationsError } = await supabase
      .from(SEAT_RESERVATIONS_TABLE)
      .select('*')
      .eq('event_id', eventId)
      .gt('expires_at', new Date().toISOString());
      
    if (reservationsError) {
      console.error('Error getting reservations:', reservationsError);
    }

    // Get purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from(SEAT_PURCHASES_TABLE)
      .select('*')
      .eq('event_id', eventId);
      
    if (purchasesError) {
      console.error('Error getting purchases:', purchasesError);
    }
    
    const result = {
      seats: seats || [],
      reservations: reservations || [],
      purchases: purchases || []
    };
    
    console.log('Seat availability retrieved:', {
      seats: result.seats.length,
      reservations: result.reservations.length,
      purchases: result.purchases.length
    });
    
    return result;
  } catch (error) {
    console.error('Error getting seat availability:', error);
    return { seats: [], reservations: [], purchases: [] };
  }
};

// Cleanup expired reservations (should be called periodically)
export const cleanupExpiredReservations = async () => {
  try {
    console.log('Cleaning up expired reservations...');
    const { error } = await supabase
      .from(SEAT_RESERVATIONS_TABLE)
      .delete()
      .lt('expires_at', new Date().toISOString());
      
    if (error) {
      console.error('Error cleaning up expired reservations:', error);
      throw error;
    }
    
    console.log('Expired reservations cleaned up successfully');
    return true;
  } catch (error) {
    console.error('Error cleaning up expired reservations:', error);
    return false;
  }
};