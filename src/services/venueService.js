import supabase from '../lib/supabase';

// Table names
const VENUES_TABLE = 'venues_fanaticka_7a3x9d';
const VENUE_SEATS_TABLE = 'venue_seats_fanaticka_7a3x9d';
const SEAT_RESERVATIONS_TABLE = 'seat_reservations_fanaticka_7a3x9d';
const SEAT_PURCHASES_TABLE = 'seat_purchases_fanaticka_7a3x9d';
const EVENTS_TABLE = 'events_fanaticka_7a3x9d'; // Добавлено для консистентности

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

export const updateVenue = async (id, venueData) => {
  try {
    console.log('Updating venue:', id, venueData);
    
    const { data, error } = await supabase
      .from(VENUES_TABLE)
      .update({
        ...venueData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating venue:', error);
      throw error;
    }

    console.log('Venue updated successfully:', data?.[0]);
    return data?.[0];
  } catch (error) {
    console.error('Error updating venue:', error);
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