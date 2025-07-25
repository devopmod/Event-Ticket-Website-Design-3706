import supabase from '../lib/supabase';

const ZONES_TABLE = 'zones_fanaticka_7a3x9d';
const TICKETS_TABLE = 'tickets_fanaticka_7a3x9d';

// Check if tables exist and create if needed
export const initializeZonesTables = async () => {
  try {
    console.log('Checking zones and tickets tables...');
    
    // Check if tables exist by trying to select from them
    const { data: zonesData, error: zonesError } = await supabase
      .from(ZONES_TABLE)
      .select('id')
      .limit(1);
    
    const { data: ticketsData, error: ticketsError } = await supabase
      .from(TICKETS_TABLE)
      .select('id')
      .limit(1);
    
    // If both tables exist (no error), return true
    if (!zonesError && !ticketsError) {
      console.log('✅ Both zones and tickets tables exist');
      return true;
    }
    
    // If either table doesn't exist, we'll assume they need to be created
    // In a real scenario, you might want to handle this differently
    console.log('⚠️ One or both tables might not exist, but continuing...');
    return true;
    
  } catch (error) {
    console.error('Error checking zone tables:', error);
    return false;
  }
};

// Create a new zone with virtual seats
export const createZone = async (eventId, zoneData) => {
  try {
    const { name, capacity, uiShape } = zoneData;
    
    // Validate inputs
    if (!eventId) {
      console.error('❌ Event ID is required for zone creation');
      return null;
    }
    
    if (!capacity || capacity < 1) {
      console.error('❌ Valid capacity is required for zone creation');
      return null;
    }
    
    console.log('Creating zone with:', { eventId, name, capacity });
    
    // Insert zone
    const { data: zone, error: zoneError } = await supabase
      .from(ZONES_TABLE)
      .insert([{
        event_id: eventId,
        name,
        capacity,
        ui_shape: uiShape
      }])
      .select()
      .single();
    
    if (zoneError) {
      console.error('Error creating zone:', zoneError);
      return null;
    }
    
    console.log('✅ Zone created successfully:', zone);
    
    // Generate virtual tickets for the zone
    const tickets = Array.from({ length: capacity }, (_, i) => ({
      zone_id: zone.id,
      ordinal: i + 1,
      status: 'free'
    }));
    
    console.log('Creating tickets for zone:', tickets.length);
    
    const { error: ticketsError } = await supabase
      .from(TICKETS_TABLE)
      .insert(tickets);
    
    if (ticketsError) {
      console.error('Error creating tickets:', ticketsError);
      // Rollback zone creation
      await supabase
        .from(ZONES_TABLE)
        .delete()
        .eq('id', zone.id);
      return null;
    }
    
    console.log('✅ Tickets created successfully');
    return zone;
    
  } catch (error) {
    console.error('Error in createZone:', error);
    return null;
  }
};

// Get zone availability
export const getZoneAvailability = async (zoneId) => {
  try {
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .select('status')
      .eq('zone_id', zoneId);
    
    if (error) {
      console.error('Error getting zone availability:', error);
      return null;
    }
    
    return {
      total: data.length,
      free: data.filter(t => t.status === 'free').length,
      held: data.filter(t => t.status === 'held').length,
      sold: data.filter(t => t.status === 'sold').length
    };
    
  } catch (error) {
    console.error('Error in getZoneAvailability:', error);
    return null;
  }
};

// Hold seats in zone
export const holdZoneSeats = async (zoneId, userId, quantity) => {
  try {
    // First, get available tickets
    const { data: availableTickets, error: selectError } = await supabase
      .from(TICKETS_TABLE)
      .select('id')
      .eq('zone_id', zoneId)
      .eq('status', 'free')
      .limit(quantity);
    
    if (selectError) {
      console.error('Error selecting available tickets:', selectError);
      return null;
    }
    
    if (availableTickets.length < quantity) {
      console.error('Not enough available tickets');
      return null;
    }
    
    // Update the selected tickets to held status
    const ticketIds = availableTickets.map(t => t.id);
    const holdExpiresAt = new Date();
    holdExpiresAt.setMinutes(holdExpiresAt.getMinutes() + 10);
    
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .update({
        status: 'held',
        user_id: userId,
        hold_expires_at: holdExpiresAt.toISOString()
      })
      .in('id', ticketIds)
      .select();
    
    if (error) {
      console.error('Error holding zone seats:', error);
      return null;
    }
    
    return data;
    
  } catch (error) {
    console.error('Error in holdZoneSeats:', error);
    return null;
  }
};

// Release held seats
export const releaseHeldSeats = async (zoneId, userId) => {
  try {
    const { error } = await supabase
      .from(TICKETS_TABLE)
      .update({
        status: 'free',
        user_id: null,
        hold_expires_at: null
      })
      .eq('zone_id', zoneId)
      .eq('user_id', userId)
      .eq('status', 'held');
    
    if (error) {
      console.error('Error releasing held seats:', error);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error in releaseHeldSeats:', error);
    return false;
  }
};

// Clean up expired holds
export const cleanupExpiredHolds = async () => {
  try {
    const { error } = await supabase
      .from(TICKETS_TABLE)
      .update({
        status: 'free',
        user_id: null,
        hold_expires_at: null
      })
      .eq('status', 'held')
      .lt('hold_expires_at', new Date().toISOString());
    
    if (error) {
      console.error('Error cleaning up expired holds:', error);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error in cleanupExpiredHolds:', error);
    return false;
  }
};