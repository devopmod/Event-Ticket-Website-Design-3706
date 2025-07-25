import supabase from '../lib/supabase';

// Table names
const TICKETS_TABLE = 'tickets_fanaticka_7a3x9d';
const ORDERS_TABLE = 'orders_fanaticka_7a3x9d';
const ORDER_ITEMS_TABLE = 'order_items_fanaticka_7a3x9d';
const USER_META_TABLE = 'user_meta_fanaticka_7a3x9d';
const EVENT_PRICES_TABLE = 'event_prices_fanaticka_7a3x9d';
const SEAT_CATEGORIES_TABLE = 'seat_categories_fanaticka_7a3x9d';

// Get available tickets for an event
export const getAvailableTickets = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .select(`
        *,
        zone:zones_fanaticka_7a3x9d(
          id,
          name,
          category:seat_categories_fanaticka_7a3x9d(id, name, color)
        ),
        seat:single_seats_fanaticka_7a3x9d(
          id,
          row_number,
          seat_number,
          section,
          x,
          y,
          category:seat_categories_fanaticka_7a3x9d(id, name, color)
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'free');

    if (error) {
      console.error('Error fetching available tickets:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAvailableTickets:', error);
    return [];
  }
};

// Hold tickets for a user
export const holdTicketsForUser = async (eventId, ticketIds, holdDurationMinutes = 10) => {
  try {
    const holdExpiresAt = new Date();
    holdExpiresAt.setMinutes(holdExpiresAt.getMinutes() + holdDurationMinutes);

    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .update({
        status: 'held',
        hold_expires_at: holdExpiresAt.toISOString()
      })
      .eq('event_id', eventId)
      .in('id', ticketIds)
      .eq('status', 'free')
      .select();

    if (error) {
      console.error('Error holding tickets:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in holdTicketsForUser:', error);
    return [];
  }
};

// Release held tickets
export const releaseHeldTickets = async (eventId, ticketIds) => {
  try {
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .update({
        status: 'free',
        hold_expires_at: null
      })
      .eq('event_id', eventId)
      .in('id', ticketIds)
      .eq('status', 'held')
      .select();

    if (error) {
      console.error('Error releasing tickets:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in releaseHeldTickets:', error);
    return [];
  }
};

// Create order and purchase tickets
export const purchaseTickets = async (eventId, ticketIds, customerData, paymentData) => {
  try {
    // First, create or get user
    let { data: user, error: userError } = await supabase
      .from(USER_META_TABLE)
      .select('id')
      .eq('email', customerData.email)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create new one
      const { data: newUser, error: createUserError } = await supabase
        .from(USER_META_TABLE)
        .insert([{
          email: customerData.email,
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          phone_number: customerData.phone
        }])
        .select('id')
        .single();

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        throw createUserError;
      }

      user = newUser;
    }

    // Get ticket prices
    const ticketPrices = await getTicketPrices(eventId, ticketIds);
    const totalPrice = ticketPrices.reduce((sum, price) => sum + price, 0);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from(ORDERS_TABLE)
      .insert([{
        user_id: user.id,
        status: 'pending',
        total_price: totalPrice,
        currency: 'EUR'
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }

    // Create order items and update tickets
    const orderItems = [];
    
    for (let i = 0; i < ticketIds.length; i++) {
      const ticketId = ticketIds[i];
      const price = ticketPrices[i];

      // Create order item
      const { data: orderItem, error: orderItemError } = await supabase
        .from(ORDER_ITEMS_TABLE)
        .insert([{
          order_id: order.id,
          unit_price: price,
          currency: 'EUR'
        }])
        .select()
        .single();

      if (orderItemError) {
        console.error('Error creating order item:', orderItemError);
        throw orderItemError;
      }

      orderItems.push(orderItem);

      // Update ticket status to sold
      const { error: ticketUpdateError } = await supabase
        .from(TICKETS_TABLE)
        .update({
          status: 'sold',
          hold_expires_at: null,
          order_item_id: orderItem.id
        })
        .eq('id', ticketId)
        .eq('event_id', eventId);

      if (ticketUpdateError) {
        console.error('Error updating ticket:', ticketUpdateError);
        throw ticketUpdateError;
      }
    }

    // Mark order as paid (in real app, this would happen after payment processing)
    const { data: paidOrder, error: paymentError } = await supabase
      .from(ORDERS_TABLE)
      .update({ status: 'paid' })
      .eq('id', order.id)
      .select()
      .single();

    if (paymentError) {
      console.error('Error updating order status:', paymentError);
      throw paymentError;
    }

    return {
      order: paidOrder,
      orderItems,
      ticketIds
    };
  } catch (error) {
    console.error('Error in purchaseTickets:', error);
    throw error;
  }
};

// Get ticket prices for specific tickets
const getTicketPrices = async (eventId, ticketIds) => {
  try {
    const { data, error } = await supabase
      .from(TICKETS_TABLE)
      .select(`
        id,
        zone:zones_fanaticka_7a3x9d(
          category_id
        ),
        seat:single_seats_fanaticka_7a3x9d(
          category_id
        )
      `)
      .eq('event_id', eventId)
      .in('id', ticketIds);

    if (error) {
      console.error('Error fetching ticket details:', error);
      throw error;
    }

    const prices = [];
    
    for (const ticket of data) {
      const categoryId = ticket.zone?.category_id || ticket.seat?.category_id;
      
      if (categoryId) {
        // Get price for this category
        const { data: priceData, error: priceError } = await supabase
          .from(EVENT_PRICES_TABLE)
          .select('price')
          .eq('event_id', eventId)
          .eq('category_id', categoryId)
          .single();

        if (priceError) {
          console.error('Error fetching price:', priceError);
          prices.push(45); // Default price
        } else {
          prices.push(priceData.price);
        }
      } else {
        prices.push(45); // Default price
      }
    }

    return prices;
  } catch (error) {
    console.error('Error in getTicketPrices:', error);
    return ticketIds.map(() => 45); // Return default prices
  }
};

// Get order details
export const getOrderDetails = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select(`
        *,
        user:user_meta_fanaticka_7a3x9d(*),
        order_items:order_items_fanaticka_7a3x9d(
          *,
          ticket:tickets_fanaticka_7a3x9d(
            *,
            event:events_fanaticka_7a3x9d(title, event_date, location),
            zone:zones_fanaticka_7a3x9d(name),
            seat:single_seats_fanaticka_7a3x9d(row_number, seat_number, section)
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    return null;
  }
};

// Cleanup expired holds
export const cleanupExpiredTicketHolds = async () => {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_holds');

    if (error) {
      console.error('Error cleaning up expired holds:', error);
      return 0;
    }

    console.log(`Cleaned up ${data} expired ticket holds`);
    return data || 0;
  } catch (error) {
    console.error('Error in cleanupExpiredTicketHolds:', error);
    return 0;
  }
};