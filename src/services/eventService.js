import supabase from '../lib/supabase';

// Table names - using existing table names from the database
const EVENTS_TABLE = 'events_fanaticka_7a3x9d';
const EVENT_SEATS_TABLE = 'event_seats_fanaticka_7a3x9d';
const VENUES_TABLE = 'venues_fanaticka_7a3x9d';

// Check if database is connected
export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error);
      return false;
    }

    console.log('Database connection test passed');
    return true;
  } catch (error) {
    console.error('Database connection test failed with exception:', error);
    return false;
  }
};

// Initialize Supabase Realtime subscription
export const initializeRealtimeSubscription = (eventId, onPriceBookUpdate, onSeatStatusChange) => {
  console.log(`Setting up Supabase Realtime for event: ${eventId}`);
  
  try {
    // Create channel for event updates (price_book changes)
    const eventChannel = supabase
      .channel(`event-${eventId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: EVENTS_TABLE, filter: `id=eq.${eventId}` },
        (payload) => {
          console.log('Event updated:', payload);
          if (payload.new && payload.new.price_book) {
            onPriceBookUpdate(payload.new.price_book);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Event channel status: ${status}`);
      });

    // Create channel for seat status changes
    const seatsChannel = supabase
      .channel(`event-seats-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: EVENT_SEATS_TABLE, filter: `event_id=eq.${eventId}` },
        (payload) => {
          console.log('Seat status changed:', payload);
          onSeatStatusChange(payload);
        }
      )
      .subscribe((status) => {
        console.log(`Seats channel status: ${status}`);
      });

    // Return cleanup function to unsubscribe channels
    return () => {
      console.log('Cleaning up Supabase Realtime subscriptions');
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(seatsChannel);
    };
  } catch (error) {
    console.error('Error setting up Realtime subscriptions:', error);
    return () => {}; // Return empty cleanup function
  }
};

// Validate venue and price book
const validateEventData = async (eventData) => {
  const errors = [];

  // Basic validation
  if (!eventData.title?.trim()) errors.push('Title is required');
  if (!eventData.description?.trim()) errors.push('Description is required');
  if (!eventData.event_date) errors.push('Event date is required');
  if (!eventData.location?.trim()) errors.push('Location is required');

  // Venue and pricing validation
  if (eventData.venue_id) {
    try {
      console.log('Validating venue:', eventData.venue_id);
      
      // Check if venue exists
      const { data: venue, error: venueError } = await supabase
        .from(VENUES_TABLE)
        .select('id, name, canvas_data')
        .eq('id', eventData.venue_id)
        .single();

      if (venueError || !venue) {
        errors.push('Selected venue does not exist');
        return errors;
      }

      // Parse venue categories
      let venueCategories = {};
      try {
        const canvasData = typeof venue.canvas_data === 'string' ? JSON.parse(venue.canvas_data) : venue.canvas_data;
        venueCategories = canvasData?.categories || {};
      } catch (e) {
        console.error('Error parsing venue canvas_data:', e);
        errors.push('Invalid venue configuration');
        return errors;
      }

      const venueCategoryIds = Object.keys(venueCategories);

      if (venueCategoryIds.length > 0) {
        const priceBookCategories = Object.keys(eventData.price_book || {});
        const missingCategories = venueCategoryIds.filter(
          categoryId => 
            !priceBookCategories.includes(categoryId) || 
            !eventData.price_book[categoryId] || 
            eventData.price_book[categoryId] <= 0
        );

        if (missingCategories.length > 0) {
          errors.push(`Missing prices for categories: ${missingCategories.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error validating venue:', error);
      errors.push('Failed to validate venue configuration');
    }
  } else {
    // General admission - should have at least one price
    if (!eventData.price_book?.GENERAL || eventData.price_book.GENERAL <= 0) {
      errors.push('General admission price is required and must be greater than 0');
    }
  }

  return errors;
};

// ИСПРАВЛЕННАЯ функция генерации начальных статусов мест
const generateInitialSeatStatuses = async (eventId, venueId) => {
  try {
    console.log('Generating initial seat statuses for event:', eventId, 'venue:', venueId);

    // Get venue data
    const { data: venue, error: venueError } = await supabase
      .from(VENUES_TABLE)
      .select('canvas_data')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      console.error('Failed to get venue for seat generation:', venueError);
      return false;
    }

    // Parse venue elements
    let elements = [];
    try {
      const canvasData = typeof venue.canvas_data === 'string' ? JSON.parse(venue.canvas_data) : venue.canvas_data;
      elements = canvasData?.elements || [];
    } catch (e) {
      console.error('Error parsing venue canvas_data:', e);
      return false;
    }

    // ИСПРАВЛЕНИЕ: Получаем как seats, так и polygons
    const seats = elements.filter(el => el.type === 'seat');
    const polygons = elements.filter(el => el.type === 'polygon');

    console.log('Found seats in venue:', seats.length);
    console.log('Found polygons in venue:', polygons.length);

    if (seats.length === 0 && polygons.length === 0) {
      console.log('No seats or polygons found in venue, skipping seat status generation');
      return true;
    }

    // Create initial seat statuses for seats
    const seatStatuses = [];
    
    // Add individual seats
    seats.forEach(seat => {
      seatStatuses.push({
        event_id: eventId,
        seat_id: String(seat.id),
        status: 'free',
        section: seat.section || seat.categoryId || 'A',
        row: parseInt(seat.row) || 1
      });
    });

    // ИСПРАВЛЕНИЕ: Add polygon areas as "virtual seats"
    polygons.forEach(polygon => {
      seatStatuses.push({
        event_id: eventId,
        seat_id: String(polygon.id), // Используем ID полигона как seat_id
        status: 'free',
        section: polygon.label || polygon.categoryId || 'POLYGON',
        row: 1 // Полигоны всегда в "ряду" 1
      });
    });

    if (seatStatuses.length === 0) {
      console.log('No seat statuses to create');
      return true;
    }

    // Bulk insert seat statuses
    const { error: insertError } = await supabase
      .from(EVENT_SEATS_TABLE)
      .insert(seatStatuses);

    if (insertError) {
      console.error('Error inserting seat statuses:', insertError);
      return false;
    }

    console.log('Successfully created initial seat statuses:', seatStatuses.length);
    return true;
  } catch (error) {
    console.error('Error generating initial seat statuses:', error);
    return false;
  }
};

// Helper function to optimize images
const optimizeImage = async (base64Image) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Maximum dimensions for image
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image with new dimensions
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with quality 0.7 to reduce size even more
      const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      resolve(optimizedBase64);
    };
    img.src = base64Image;
  });
};

// Create a new event with validation and seat generation
export const createEvent = async (eventData) => {
  try {
    console.log('Creating event with data:', eventData);

    // Clean price book to only keep categories that exist in venue
    let cleanedPriceBook = { ...eventData.price_book };
    if (eventData.venue_id) {
      try {
        const { data: venue } = await supabase
          .from(VENUES_TABLE)
          .select('canvas_data')
          .eq('id', eventData.venue_id)
          .single();

        if (venue?.canvas_data) {
          const canvasData = typeof venue.canvas_data === 'string' ? JSON.parse(venue.canvas_data) : venue.canvas_data;
          const venueCategories = Object.keys(canvasData?.categories || {});
          
          // Create a new price book with only the venue categories
          const newPriceBook = {};
          venueCategories.forEach(categoryId => {
            // Use the price from eventData if it exists, otherwise set a default price
            newPriceBook[categoryId] = eventData.price_book[categoryId] || 45;
          });
          cleanedPriceBook = newPriceBook;
          console.log('Cleaned price book:', cleanedPriceBook);
        }
      } catch (e) {
        console.error('Error cleaning price book:', e);
      }
    }

    // Update eventData with cleaned price book
    const cleanedEventData = {
      ...eventData,
      price_book: cleanedPriceBook
    };

    // Validate event data
    const validationErrors = await validateEventData(cleanedEventData);
    if (validationErrors.length > 0) {
      const error = new Error('Validation failed');
      error.details = validationErrors;
      error.status = 422;
      throw error;
    }

    // Optimize image if provided as base64
    let imageUrl = cleanedEventData.image;
    if (imageUrl && imageUrl.startsWith('data:image')) {
      console.log('Optimizing image...');
      try {
        imageUrl = await optimizeImage(imageUrl);
        console.log('Image optimized successfully');
      } catch (imageError) {
        console.error('Error optimizing image:', imageError);
        imageUrl = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
      }
    }

    // Prepare data for insertion
    const formattedEventData = {
      title: cleanedEventData.title.trim(),
      description: cleanedEventData.description.trim(),
      category: cleanedEventData.category,
      date: cleanedEventData.date,
      event_date: cleanedEventData.event_date,
      location: cleanedEventData.location?.trim() || '',
      artist: cleanedEventData.artist?.trim() || null,
      genre: cleanedEventData.genre?.trim() || null,
      image: imageUrl,
      venue_id: cleanedEventData.venue_id || null,
      price_book: cleanedPriceBook
    };

    console.log('Formatted event data for insertion:', formattedEventData);

    // Test connection before inserting
    const connectionOk = await testDatabaseConnection();
    if (!connectionOk) {
      throw new Error('Database connection failed');
    }

    // Insert event
    const { data: newEvents, error: insertError } = await supabase
      .from(EVENTS_TABLE)
      .insert([formattedEventData])
      .select();

    if (insertError) {
      console.error('Supabase error creating event:', insertError);
      throw new Error(`Failed to create event: ${insertError.message}`);
    }

    if (!newEvents || newEvents.length === 0) {
      throw new Error('No data returned after event creation');
    }

    const newEvent = newEvents[0];
    console.log('Event created successfully:', newEvent);

    // Generate initial seat statuses if venue is selected
    if (newEvent.venue_id) {
      const seatGeneration = await generateInitialSeatStatuses(newEvent.id, newEvent.venue_id);
      if (!seatGeneration) {
        console.warn('Failed to generate initial seat statuses, but event was created');
      }
    }

    return newEvent;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

// Fetch all events
export const fetchEvents = async () => {
  try {
    console.log('Fetching events from table:', EVENTS_TABLE);
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in fetchEvents:', error);
      throw error;
    }

    console.log('Events fetched successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

// Fetch event by ID with venue data
export const fetchEventById = async (id) => {
  try {
    console.log('Fetching event by ID:', id);
    
    // Use a simpler approach without relationships
    const { data: event, error: eventError } = await supabase
      .from(EVENTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (eventError) {
      console.error('Error fetching event by ID:', eventError);
      throw eventError;
    }

    // If event has venue_id, fetch venue separately
    if (event && event.venue_id) {
      const { data: venue, error: venueError } = await supabase
        .from(VENUES_TABLE)
        .select('*')
        .eq('id', event.venue_id)
        .single();

      if (!venueError && venue) {
        // Add venue to event
        event.venue = venue;
      }
    }

    console.log('Event fetched successfully:', event);
    return event;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
};

// Update event price book
export const updateEventPriceBook = async (id, priceBook) => {
  try {
    console.log('Updating price book for event:', id, priceBook);

    // Validate price book
    const errors = [];
    for (const [categoryId, price] of Object.entries(priceBook)) {
      if (!price || price <= 0) {
        errors.push(`Price for category "${categoryId}" must be greater than 0`);
      }
    }

    if (errors.length > 0) {
      const error = new Error('Invalid price book');
      error.details = errors;
      error.status = 422;
      throw error;
    }

    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .update({
        price_book: priceBook,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*');

    if (error) {
      console.error('Error updating event price book:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Event not found');
    }

    console.log('Price book updated successfully:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error updating event price book:', error);
    throw error;
  }
};

// Get event seat statuses
export const getEventSeatStatuses = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from(EVENT_SEATS_TABLE)
      .select('*')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching seat statuses:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching seat statuses:', error);
    return [];
  }
};

// Update seat status
export const updateSeatStatus = async (eventId, seatId, status) => {
  try {
    console.log('Updating seat status:', eventId, seatId, status);
    
    // Ensure seatId is stored as text
    const seatIdString = String(seatId);

    if (!['free', 'held', 'sold'].includes(status)) {
      throw new Error('Invalid seat status');
    }

    const { data, error } = await supabase
      .from(EVENT_SEATS_TABLE)
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('seat_id', seatIdString)
      .select('seat_id, status');

    if (error) {
      console.error('Error updating seat status:', error);
      throw error;
    }

    console.log('Seat status updated successfully:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error updating seat status:', error);
    throw error;
  }
};

// Bulk update seat statuses
export const bulkUpdateSeatStatuses = async (eventId, seatUpdates) => {
  try {
    console.log('Bulk updating seat statuses for event:', eventId, 'updates:', seatUpdates.length);

    const updates = seatUpdates.map(({ seatId, status }) => ({
      event_id: eventId,
      seat_id: String(seatId),
      status: status,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from(EVENT_SEATS_TABLE)
      .upsert(updates)
      .select('*');

    if (error) {
      console.error('Error bulk updating seat statuses:', error);
      throw error;
    }

    console.log('Bulk seat status update successful:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error bulk updating seat statuses:', error);
    throw error;
  }
};

// ИСПРАВЛЕННАЯ функция получения статистики события
export const getEventStatistics = async (eventId) => {
  try {
    console.log('Fetching event statistics for:', eventId);

    // Get seat statuses
    const seatStatuses = await getEventSeatStatuses(eventId);

    // Calculate statistics
    const totalSeats = seatStatuses.length;
    const soldSeats = seatStatuses.filter(s => s.status === 'sold').length;
    const heldSeats = seatStatuses.filter(s => s.status === 'held').length;
    const freeSeats = seatStatuses.filter(s => s.status === 'free').length;

    // Get event to calculate revenue based on price book
    const { data: event } = await supabase
      .from(EVENTS_TABLE)
      .select('price_book, venue_id')
      .eq('id', eventId)
      .single();

    let estimatedRevenue = 0;
    let averagePrice = 0;

    if (event && event.price_book) {
      // Calculate average price from price book
      const prices = Object.values(event.price_book).filter(p => p > 0);
      averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
      
      // Estimate revenue based on average price
      estimatedRevenue = Math.round(soldSeats * averagePrice);
    }

    const todaysSales = Math.floor(soldSeats * 0.15); // 15% sold today (mock data)
    const todaysRevenue = Math.round(todaysSales * averagePrice);

    return {
      totalSeats,
      soldSeats,
      heldSeats,
      freeSeats,
      occupancyRate: totalSeats > 0 ? Math.round((soldSeats / totalSeats) * 100) : 0,
      estimatedRevenue,
      todaysSales: todaysRevenue,
      averagePrice: Math.round(averagePrice),
      salesGrowth: '+12%' // Mock data
    };
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    return {
      totalSeats: 0,
      soldSeats: 0,
      heldSeats: 0,
      freeSeats: 0,
      occupancyRate: 0,
      estimatedRevenue: 0,
      todaysSales: 0,
      averagePrice: 0,
      salesGrowth: '0%'
    };
  }
};

// Update an existing event
export const updateEvent = async (id, eventData) => {
  try {
    console.log('Updating event:', id, eventData);

    // Clean price book to only keep categories that exist in venue
    let cleanedPriceBook = { ...eventData.price_book };
    if (eventData.venue_id) {
      try {
        const { data: venue } = await supabase
          .from(VENUES_TABLE)
          .select('canvas_data')
          .eq('id', eventData.venue_id)
          .single();

        if (venue?.canvas_data) {
          const canvasData = typeof venue.canvas_data === 'string' ? JSON.parse(venue.canvas_data) : venue.canvas_data;
          const venueCategories = Object.keys(canvasData?.categories || {});
          
          // Create a new price book with only the venue categories
          const newPriceBook = {};
          venueCategories.forEach(categoryId => {
            // Use the price from eventData if it exists, otherwise set a default price
            newPriceBook[categoryId] = eventData.price_book[categoryId] || 45;
          });
          cleanedPriceBook = newPriceBook;
          console.log('Cleaned price book for update:', cleanedPriceBook);
        }
      } catch (e) {
        console.error('Error cleaning price book for update:', e);
      }
    }

    // Prepare data for update
    const updateData = {
      title: eventData.title?.trim(),
      description: eventData.description?.trim(),
      category: eventData.category,
      date: eventData.date,
      event_date: eventData.event_date,
      location: eventData.location?.trim(),
      artist: eventData.artist?.trim() || null,
      genre: eventData.genre?.trim() || null,
      venue_id: eventData.venue_id || null,
      price_book: cleanedPriceBook,
      updated_at: new Date().toISOString()
    };

    // Only update image if it's provided
    if (eventData.image) {
      if (eventData.image.startsWith('data:image')) {
        // Optimize base64 image
        updateData.image = await optimizeImage(eventData.image);
      } else {
        updateData.image = eventData.image;
      }
    }

    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .update(updateData)
      .eq('id', id)
      .select('*');

    if (error) {
      console.error('Error updating event:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Event not found');
    }

    console.log('Event updated successfully:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (id) => {
  try {
    // First delete related seat statuses
    const { error: seatError } = await supabase
      .from(EVENT_SEATS_TABLE)
      .delete()
      .eq('event_id', id);

    if (seatError) {
      console.error('Error deleting event seats:', seatError);
    }

    // Then delete the event
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
    console.error('Error deleting event:', error);
    return false;
  }
};

// НОВАЯ функция для регенерации мест существующего события
export const regenerateEventSeats = async (eventId) => {
  try {
    console.log('Regenerating seats for event:', eventId);

    // Get event data
    const { data: event, error: eventError } = await supabase
      .from(EVENTS_TABLE)
      .select('venue_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event || !event.venue_id) {
      console.error('Event not found or has no venue:', eventError);
      return false;
    }

    // Delete existing seat statuses
    const { error: deleteError } = await supabase
      .from(EVENT_SEATS_TABLE)
      .delete()
      .eq('event_id', eventId);

    if (deleteError) {
      console.error('Error deleting existing seat statuses:', deleteError);
      return false;
    }

    // Generate new seat statuses
    const success = await generateInitialSeatStatuses(eventId, event.venue_id);
    
    if (success) {
      console.log('Successfully regenerated seats for event:', eventId);
    } else {
      console.error('Failed to regenerate seats for event:', eventId);
    }

    return success;
  } catch (error) {
    console.error('Error regenerating event seats:', error);
    return false;
  }
};

// Cleanup expired reservations (should be called periodically)
export const cleanupExpiredReservations = async () => {
  try {
    // In a real application, you would have a reservations table with expiry times
    // Here we just simulate cleaning up held seats older than 10 minutes
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const { data, error } = await supabase
      .from(EVENT_SEATS_TABLE)
      .update({
        status: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'held')
      .lt('updated_at', tenMinutesAgo.toISOString())
      .select('seat_id');

    if (error) {
      console.error('Error cleaning up expired reservations:', error);
      throw error;
    }

    console.log('Expired reservations cleaned up:', data?.length || 0);
    return data?.length || 0;
  } catch (error) {
    console.error('Error cleaning up expired reservations:', error);
    return 0;
  }
};