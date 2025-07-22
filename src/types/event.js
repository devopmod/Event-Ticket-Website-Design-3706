// Event Types - Prices + Statuses
export const createEventStructure = () => ({
  id: '',
  title: '',
  description: '',
  date: '',
  event_date: '',
  location: '',
  category: '',
  venue_id: null,
  priceBook: {
    // "PAR_L": 460,
    // "VIP": 700,
    // "BALC": 300
  },
  // Seat statuses will be managed via WebSocket/real-time updates
});

export const PriceBookOperations = {
  UPDATE_CATEGORY_PRICE: 'UPDATE_CATEGORY_PRICE',
  BULK_UPDATE_SEATS: 'BULK_UPDATE_SEATS'
};

// WebSocket message types
export const WebSocketMessageTypes = {
  SEAT_STATUS_CHANGED: 'seatStatusChanged',
  PRICE_BOOK_UPDATED: 'priceBookUpdated'
};

export const createSeatStatusMessage = (seatId, status) => ({
  kind: WebSocketMessageTypes.SEAT_STATUS_CHANGED,
  seatId,
  status // "free" | "held" | "sold"
});

export const createPriceBookMessage = (priceBook) => ({
  kind: WebSocketMessageTypes.PRICE_BOOK_UPDATED,
  priceBook // Record<string, number>
});