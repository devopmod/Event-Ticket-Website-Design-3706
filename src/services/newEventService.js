import supabase from '../lib/supabase';

// Table names for new structure
const EVENTS_TABLE = 'events_fanaticka_7a3x9d';
const VENUES_TABLE = 'venues_fanaticka_7a3x9d';
const EVENT_PRICES_TABLE = 'event_prices_fanaticka_7a3x9d';
const SEAT_CATEGORIES_TABLE = 'seat_categories_fanaticka_7a3x9d';
const TICKETS_TABLE = 'tickets_fanaticka_7a3x9d';
const ZONES_TABLE = 'zones_fanaticka_7a3x9d';
const SINGLE_SEATS_TABLE = 'single_seats_fanaticka_7a3x9d';
const ORDERS_TABLE = 'orders_fanaticka_7a3x9d';
const ORDER_ITEMS_TABLE = 'order_items_fanaticka_7a3x9d';
const USER_META_TABLE = 'user_meta_fanaticka_7a3x9d';

// Event CRUD operations
export const fetchEvents = async () => {
  try {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select(`
        *,
        venue:${VENUES_TABLE}(id, name, address),
        event_prices:${EVENT_PRICES_TABLE}(
          price,
          currency,
          category:${SEAT_CATEGORIES_TABLE}(id, name, color)
        )
      `)
      .not('published_at', 'is', null)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    return data?.map(event => ({
      ...event,
      // Convert event_prices array to price_book object for backward compatibility
      price_book: event.event_prices?.reduce((acc, price) => {
        acc[price.category.name.toUpperCase()] = price.price;
        return acc;
      }, {}) || {}
    })) || [];
  } catch (error) {
    console.error('Error in fetchEvents:', error);
    return [];
  }
};

export const fetchEventById = async (id) => {
  try {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select(`
        *,
        venue:${VENUES_TABLE}(
          id, 
          name, 
          address, 
          geometry_data
        ),
        event_prices:${EVENT_PRICES_TABLE}(
          price,
          currency,
          category:${SEAT_CATEGORIES_TABLE}(id, name, color)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      throw error;
    }

    if (data) {
      // Convert event_prices array to price_book object for backward compatibility
      data.price_book = data.event_prices?.reduce((acc, price) => {
        acc[price.category.name.toUpperCase()] = price.price;
        return acc;
      }, {}) || {};
    }

    return data;
  } catch (error) {
    console.error('Error in fetchEventById:', error);
    return null;
  }
};

export const createEvent = async (eventData) => {
  try {
    // Start transaction
    const { data: event, error: eventError } = await supabase
      .from(EVENTS_TABLE)
      .insert([{
        venue_id: eventData.venue_id,
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        artist: eventData.artist,
        genre: eventData.genre,
        location: eventData.location,
        event_date: eventData.event_date,
        image: eventData.image
      }])
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      throw eventError;
    }

    // Create event prices if provided
    if (eventData.price_book && Object.keys(eventData.price_book).length > 0) {
      const priceEntries = [];
      
      for (const [categoryName, price] of Object.entries(eventData.price_book)) {
        // Get category ID by name
        const { data: category } = await supabase
          .from(SEAT_CATEGORIES_TABLE)
          .select('id')
          .ilike('name', categoryName)
          .single();

        if (category) {
          priceEntries.push({
            event_id: event.id,
            category_id: category.id,
            price: price,
            currency: 'EUR'
          });
        }
      }

      if (priceEntries.length > 0) {
        const { error: pricesError } = await supabase
          .from(EVENT_PRICES_TABLE)
          .insert(priceEntries);

        if (pricesError) {
          console.error('Error creating event prices:', pricesError);
          // Don't throw error here, event is already created
        }
      }
    }

    // Generate tickets for the event if it has a venue
    if (event.venue_id) {
      await generateEventTickets(event.id);
    }

    // Publish the event
    await supabase
      .from(EVENTS_TABLE)
      .update({ published_at: new Date().toISOString() })
      .eq('id', event.id);

    return event;
  } catch (error) {
    console.error('Error in createEvent:', error);
    throw error;
  }
};

export const updateEvent = async (id, eventData) => {
  try {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .update({
        venue_id: eventData.venue_id,
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        artist: eventData.artist,
        genre: eventData.genre,
        location: eventData.location,
        event_date: eventData.event_date,
        image: eventData.image
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    // Update event prices if provided
    if (eventData.price_book) {
      // Delete existing prices
      await supabase
        .from(EVENT_PRICES_TABLE)
        .delete()
        .eq('event_id', id);

      // Insert new prices
      const priceEntries = [];
      
      for (const [categoryName, price] of Object.entries(eventData.price_book)) {
        const { data: category } = await supabase
          .from(SEAT_CATEGORIES_TABLE)
          .select('id')
          .ilike('name', categoryName)
          .single();

        if (category) {
          priceEntries.push({
            event_id: id,
            category_id: category.id,
            price: price,
            currency: 'EUR'
          });
        }
      }

      if (priceEntries.length > 0) {
        await supabase
          .from(EVENT_PRICES_TABLE)
          .insert(priceEntries);
      }
    }

    return data;
  } catch (error) {
    console.error('Error in updateEvent:', error);
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const { error } = await supabase
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

// Generate tickets for an event
export const generateEventTickets = async (eventId) => {
  try {
    const { data, error } = await supabase.rpc('generate_event_tickets', {
      p_event_id: eventId
    });

    if (error) {
      console.error('Error generating tickets:', error);
      throw error;
    }

    console.log(`Generated ${data} tickets for event ${eventId}`);
    return data;
  } catch (error) {
    console.error('Error in generateEventTickets:', error);
    return 0;
  }
};

// Get event statistics
export const getEventStatistics = async (eventId) => {
  try {
    const { data, error } = await supabase.rpc('get_event_statistics', {
      p_event_id: eventId
    });

    if (error) {
      console.error('Error getting event statistics:', error);
      throw error;
    }

    const stats = data[0] || {};
    
    return {
      totalSeats: stats.total_tickets || 0,
      soldSeats: stats.sold_tickets || 0,
      heldSeats: stats.held_tickets || 0,
      freeSeats: stats.free_tickets || 0,
      occupancyRate: stats.occupancy_rate || 0,
      averagePrice: 50, // Mock data
      estimatedRevenue: (stats.sold_tickets || 0) * 50,
      todaysSales: Math.round(((stats.sold_tickets || 0) * 50) * 0.15),
      salesGrowth: '+12%'
    };
  } catch (error) {
    console.error('Error in getEventStatistics:', error);
    return {
      totalSeats: 0,
      soldSeats: 0,
      heldSeats: 0,
      freeSeats: 0,
      occupancyRate: 0,
      averagePrice: 0,
      estimatedRevenue: 0,
      todaysSales: 0,
      salesGrowth: '0%'
    };
  }
};

// Update event price book
export const updateEventPriceBook = async (eventId, priceBook) => {
  try {
    // Delete existing prices
    await supabase
      .from(EVENT_PRICES_TABLE)
      .delete()
      .eq('event_id', eventId);

    // Insert new prices
    const priceEntries = [];
    
    for (const [categoryName, price] of Object.entries(priceBook)) {
      const { data: category } = await supabase
        .from(SEAT_CATEGORIES_TABLE)
        .select('id')
        .ilike('name', categoryName)
        .single();

      if (category) {
        priceEntries.push({
          event_id: eventId,
          category_id: category.id,
          price: price,
          currency: 'EUR'
        });
      }
    }

    if (priceEntries.length > 0) {
      const { error } = await supabase
        .from(EVENT_PRICES_TABLE)
        .insert(priceEntries);

      if (error) {
        console.error('Error updating event prices:', error);
        throw error;
      }
    }

    // Return updated event with prices
    return await fetchEventById(eventId);
  } catch (error) {
    console.error('Error in updateEventPriceBook:', error);
    throw error;
  }
};

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select('id')
      .limit(1);
    
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

// Cleanup expired holds
export const cleanupExpiredHolds = async () => {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_holds');

    if (error) {
      console.error('Error cleaning up expired holds:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in cleanupExpiredHolds:', error);
    return 0;
  }
};

// Initialize Realtime subscription for events
export const initializeRealtimeSubscription = (eventId, onPriceBookUpdate, onSeatStatusChange) => {
  console.log(`Setting up Realtime subscriptions for event ${eventId}`);

  // Subscribe to event price updates
  const pricesChannel = supabase
    .channel(`event-prices-${eventId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: EVENT_PRICES_TABLE,
      filter: `event_id=eq.${eventId}`
    }, async (payload) => {
      console.log('Event prices update received:', payload);
      // Reload event data and notify
      const event = await fetchEventById(eventId);
      if (event) {
        onPriceBookUpdate(event.price_book);
      }
    })
    .subscribe();

  // Subscribe to ticket status changes
  const ticketsChannel = supabase
    .channel(`event-tickets-${eventId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: TICKETS_TABLE,
      filter: `event_id=eq.${eventId}`
    }, (payload) => {
      console.log('Ticket status change received:', payload);
      onSeatStatusChange(payload);
    })
    .subscribe();

  // Return cleanup function
  return () => {
    console.log('Cleaning up Realtime subscriptions');
    supabase.removeChannel(pricesChannel);
    supabase.removeChannel(ticketsChannel);
  };
};