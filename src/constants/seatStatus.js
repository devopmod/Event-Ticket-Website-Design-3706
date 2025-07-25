// Seat status constants - ensuring consistency across the app
export const SEAT_STATUS = {
  FREE: 'free',
  HELD: 'held',
  SOLD: 'sold',
};

// Valid status transitions
export const VALID_STATUS_TRANSITIONS = {
  [SEAT_STATUS.FREE]: [SEAT_STATUS.HELD, SEAT_STATUS.SOLD],
  [SEAT_STATUS.HELD]: [SEAT_STATUS.FREE, SEAT_STATUS.SOLD],
  [SEAT_STATUS.SOLD]: [], // Sold seats cannot be changed
};

export const getStatusColor = (status) => {
  switch (status) {
    case SEAT_STATUS.FREE: return '#3B82F6'; // Blue
    case SEAT_STATUS.HELD: return '#F59E0B'; // Amber
    case SEAT_STATUS.SOLD: return '#6B7280'; // Gray
    default: return '#9CA3AF'; // Default gray
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case SEAT_STATUS.FREE: return 'Available';
    case SEAT_STATUS.HELD: return 'Reserved';
    case SEAT_STATUS.SOLD: return 'Sold';
    default: return 'Unknown';
  }
};
