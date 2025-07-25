// Venue Types - Pure Geometry + Categories
export const VenueElementTypes = {
  SEAT: 'seat',
  SECTION: 'section', 
  STAGE: 'stage',
  POLYGON: 'polygon'
};

export const SeatStatus = {
  FREE: 'free',
  HELD: 'held', 
  SOLD: 'sold'
};

// Venue structure - NO prices, NO statuses
export const createVenueStructure = () => ({
  venueId: '',
  name: '',
  description: '',
  categories: {
    // "PAR_L": { "name": "Parterre Left", "color": "#00ff00" }
  },
  elements: [
    // { "id": "A1-12", "type": "seat", "x": 134, "y": 220, "categoryId": "PAR_L" }
  ]
});

export const createCategory = (id, name, color) => ({
  id,
  name,
  color
});

export const createSeatElement = (id, x, y, categoryId) => ({
  id,
  type: VenueElementTypes.SEAT,
  x,
  y,
  categoryId,
  // No price, no status - pure geometry
});