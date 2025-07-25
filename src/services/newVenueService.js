import supabase from '../lib/supabase';

// Table names
const VENUES_TABLE = 'venues_fanaticka_7a3x9d';
const ZONES_TABLE = 'zones_fanaticka_7a3x9d';
const SINGLE_SEATS_TABLE = 'single_seats_fanaticka_7a3x9d';
const SEAT_CATEGORIES_TABLE = 'seat_categories_fanaticka_7a3x9d';
const TICKETS_TABLE = 'tickets_fanaticka_7a3x9d';

// Venue CRUD operations
export const fetchVenues = async () => {
  try {
    const { data, error } = await supabase
      .from(VENUES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching venues:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchVenues:', error);
    return [];
  }
};

export const fetchVenueById = async (id) => {
  try {
    const { data, error } = await supabase
      .from(VENUES_TABLE)
      .select(`
        *,
        zones:${ZONES_TABLE}(
          *,
          category:${SEAT_CATEGORIES_TABLE}(id, name, color)
        ),
        single_seats:${SINGLE_SEATS_TABLE}(
          *,
          category:${SEAT_CATEGORIES_TABLE}(id, name, color)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching venue:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchVenueById:', error);
    return null;
  }
};

export const createVenue = async (venueData) => {
  try {
    console.log('Creating venue:', venueData);

    const { data: venue, error: venueError } = await supabase
      .from(VENUES_TABLE)
      .insert([{
        name: venueData.name,
        address: venueData.address || '',
        geometry_data: venueData.geometry_data || venueData.canvas_data || {}
      }])
      .select()
      .single();

    if (venueError) {
      console.error('Error creating venue:', venueError);
      throw venueError;
    }

    // Create zones and seats based on geometry_data
    if (venue.geometry_data?.elements) {
      await createVenueElements(venue.id, venue.geometry_data.elements);
    }

    console.log('Venue created successfully:', venue);
    return venue;
  } catch (error) {
    console.error('Error in createVenue:', error);
    throw error;
  }
};

export const updateVenue = async (id, venueData) => {
  try {
    console.log('Updating venue:', id, venueData);

    const { data: venue, error: venueError } = await supabase
      .from(VENUES_TABLE)
      .update({
        name: venueData.name,
        address: venueData.address || '',
        geometry_data: venueData.geometry_data || venueData.canvas_data || {}
      })
      .eq('id', id)
      .select()
      .single();

    if (venueError) {
      console.error('Error updating venue:', venueError);
      throw venueError;
    }

    // Clear existing zones and seats
    await supabase.from(ZONES_TABLE).delete().eq('venue_id', id);
    await supabase.from(SINGLE_SEATS_TABLE).delete().eq('venue_id', id);

    // Recreate zones and seats based on new geometry_data
    if (venue.geometry_data?.elements) {
      await createVenueElements(venue.id, venue.geometry_data.elements);
    }

    console.log('Venue updated successfully:', venue);
    return venue;
  } catch (error) {
    console.error('Error in updateVenue:', error);
    throw error;
  }
};

export const deleteVenue = async (id) => {
  try {
    const { error } = await supabase
      .from(VENUES_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting venue:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteVenue:', error);
    return false;
  }
};

// Create venue elements (zones and seats) from geometry data
const createVenueElements = async (venueId, elements) => {
  try {
    for (const element of elements) {
      if (element.type === 'seat') {
        await createSingleSeat(venueId, element);
      } else if (element.type === 'section' || element.type === 'polygon') {
        if (element.capacity && element.capacity > 1) {
          await createZone(venueId, element);
        } else {
          await createSingleSeat(venueId, element);
        }
      }
    }
  } catch (error) {
    console.error('Error creating venue elements:', error);
    throw error;
  }
};

// Create a single seat
const createSingleSeat = async (venueId, element) => {
  try {
    // Get category ID
    const categoryId = await getCategoryId(element.categoryId || 'General');

    const { error } = await supabase
      .from(SINGLE_SEATS_TABLE)
      .insert([{
        venue_id: venueId,
        category_id: categoryId,
        row_number: element.row || 1,
        seat_number: parseInt(element.number) || 1,
        section: element.section || 'A',
        x: element.x,
        y: element.y
      }]);

    if (error) {
      console.error('Error creating single seat:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createSingleSeat:', error);
    throw error;
  }
};

// Create a zone
const createZone = async (venueId, element) => {
  try {
    // Get category ID
    const categoryId = await getCategoryId(element.categoryId || 'General');

    const uiShape = element.type === 'polygon' 
      ? { type: 'polygon', points: element.points }
      : { 
          type: 'section', 
          x: element.x, 
          y: element.y, 
          width: element.width, 
          height: element.height 
        };

    const { error } = await supabase
      .from(ZONES_TABLE)
      .insert([{
        venue_id: venueId,
        category_id: categoryId,
        name: element.label || `Zone ${element.id}`,
        capacity: element.capacity || 1,
        ui_shape: uiShape
      }]);

    if (error) {
      console.error('Error creating zone:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createZone:', error);
    throw error;
  }
};

// Get category ID by name, create if doesn't exist
const getCategoryId = async (categoryName) => {
  try {
    // Try to find existing category
    let { data: category, error } = await supabase
      .from(SEAT_CATEGORIES_TABLE)
      .select('id')
      .ilike('name', categoryName)
      .single();

    if (error && error.code === 'PGRST116') {
      // Category doesn't exist, create it
      const { data: newCategory, error: createError } = await supabase
        .from(SEAT_CATEGORIES_TABLE)
        .insert([{
          name: categoryName,
          color: getDefaultColorForCategory(categoryName)
        }])
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating category:', createError);
        throw createError;
      }

      category = newCategory;
    }

    return category.id;
  } catch (error) {
    console.error('Error getting category ID:', error);
    // Return default General category ID if available
    const { data: defaultCategory } = await supabase
      .from(SEAT_CATEGORIES_TABLE)
      .select('id')
      .ilike('name', 'General')
      .single();
    
    return defaultCategory?.id || null;
  }
};

// Get default color for category
const getDefaultColorForCategory = (categoryName) => {
  const colorMap = {
    'General': '#3B82F6',
    'VIP': '#8B5CF6',
    'Premium': '#F59E0B',
    'Balcony': '#10B981',
    'Parterre': '#EC4899',
    'Standing': '#06B6D4'
  };

  return colorMap[categoryName] || '#6B7280';
};

// Get venue seat count
export const getVenueSeatsCount = async (venueId) => {
  try {
    console.log('Calculating seats count for venue:', venueId);

    // Get zones and their capacities
    const { data: zones, error: zonesError } = await supabase
      .from(ZONES_TABLE)
      .select('capacity, category:seat_categories_fanaticka_7a3x9d(name)')
      .eq('venue_id', venueId);

    if (zonesError) {
      console.error('Error fetching zones:', zonesError);
    }

    // Get individual seats
    const { data: seats, error: seatsError } = await supabase
      .from(SINGLE_SEATS_TABLE)
      .select('id, category:seat_categories_fanaticka_7a3x9d(name)')
      .eq('venue_id', venueId);

    if (seatsError) {
      console.error('Error fetching seats:', seatsError);
    }

    const result = {
      total: 0,
      byType: { zone: 0, seat: 0 },
      byCategory: {},
      elements: (zones?.length || 0) + (seats?.length || 0),
      bookableElements: (zones?.length || 0) + (seats?.length || 0)
    };

    // Count zone capacities
    zones?.forEach(zone => {
      result.total += zone.capacity;
      result.byType.zone += 1;
      
      const categoryName = zone.category?.name || 'UNCATEGORIZED';
      result.byCategory[categoryName] = (result.byCategory[categoryName] || 0) + zone.capacity;
    });

    // Count individual seats
    seats?.forEach(seat => {
      result.total += 1;
      result.byType.seat += 1;
      
      const categoryName = seat.category?.name || 'UNCATEGORIZED';
      result.byCategory[categoryName] = (result.byCategory[categoryName] || 0) + 1;
    });

    console.log('Venue seats count:', result);
    return result;
  } catch (error) {
    console.error('Error calculating venue seats count:', error);
    return {
      total: 0,
      byType: { zone: 0, seat: 0 },
      byCategory: {},
      elements: 0,
      bookableElements: 0
    };
  }
};

// Get tickets for an event
export const getEventTickets = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .select(`
        *,
        zone:${ZONES_TABLE}(
          *,
          category:${SEAT_CATEGORIES_TABLE}(id, name, color)
        ),
        seat:${SINGLE_SEATS_TABLE}(
          *,
          category:${SEAT_CATEGORIES_TABLE}(id, name, color)
        )
      `)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching event tickets:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEventTickets:', error);
    return [];
  }
};

// Hold tickets
export const holdTickets = async (eventId, ticketIds, holdDurationMinutes = 10) => {
  try {
    const { data, error } = await supabase.rpc('hold_tickets', {
      p_event_id: eventId,
      p_ticket_ids: ticketIds,
      p_hold_duration_minutes: holdDurationMinutes
    });

    if (error) {
      console.error('Error holding tickets:', error);
      throw error;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in holdTickets:', error);
    return 0;
  }
};

// Release tickets
export const releaseTickets = async (eventId, ticketIds) => {
  try {
    const { data, error } = await supabase.rpc('release_tickets', {
      p_event_id: eventId,
      p_ticket_ids: ticketIds
    });

    if (error) {
      console.error('Error releasing tickets:', error);
      throw error;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in releaseTickets:', error);
    return 0;
  }
};

// Cleanup expired reservations (backward compatibility)
export const cleanupExpiredReservations = async () => {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_holds');

    if (error) {
      console.error('Error cleaning up expired holds:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error in cleanupExpiredReservations:', error);
    return 0;
  }
};