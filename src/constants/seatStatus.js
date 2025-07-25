// Seat status constants - ensuring consistency across the app
export const SEAT_STATUS = {
  FREE: 'free',
  HELD: 'held',
  SOLD: 'sold',
  BOOKED: 'booked'
};

// Valid status transitions
export const VALID_STATUS_TRANSITIONS = {
  [SEAT_STATUS.FREE]: [SEAT_STATUS.HELD, SEAT_STATUS.SOLD],
  [SEAT_STATUS.HELD]: [SEAT_STATUS.FREE, SEAT_STATUS.SOLD],
  [SEAT_STATUS.SOLD]: [], // Sold seats cannot be changed
  [SEAT_STATUS.BOOKED]: [SEAT_STATUS.FREE] // Booked seats can be released
};

export const getStatusColor = (status) => {
  switch (status) {
    case SEAT_STATUS.FREE: return '#3B82F6'; // Blue
    case SEAT_STATUS.HELD: return '#F59E0B'; // Amber
    case SEAT_STATUS.SOLD: return '#6B7280'; // Gray
    case SEAT_STATUS.BOOKED: return '#10B981'; // Green
    default: return '#9CA3AF'; // Default gray
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case SEAT_STATUS.FREE: return 'Available';
    case SEAT_STATUS.HELD: return 'Reserved';
    case SEAT_STATUS.SOLD: return 'Sold';
    case SEAT_STATUS.BOOKED: return 'Booked';
    default: return 'Unknown';
  }
};
