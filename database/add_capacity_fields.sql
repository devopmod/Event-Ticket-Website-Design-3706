-- Add capacity fields to event_seats table
ALTER TABLE event_seats_fanaticka_7a3x9d 
ADD COLUMN IF NOT EXISTS total_capacity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS available_capacity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_bookable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS element_type TEXT DEFAULT 'seat';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_event_seats_capacity ON event_seats_fanaticka_7a3x9d(event_id, is_bookable, available_capacity);

-- Add comment for documentation
COMMENT ON COLUMN event_seats_fanaticka_7a3x9d.total_capacity IS 'Total number of seats available in this element (for polygons/sections)';
COMMENT ON COLUMN event_seats_fanaticka_7a3x9d.available_capacity IS 'Currently available seats in this element';
COMMENT ON COLUMN event_seats_fanaticka_7a3x9d.is_bookable IS 'Whether this element can be booked by customers';
COMMENT ON COLUMN event_seats_fanaticka_7a3x9d.element_type IS 'Type of element: seat, polygon, section, stage';

-- Update existing records to have proper defaults
UPDATE event_seats_fanaticka_7a3x9d 
SET 
  total_capacity = 1,
  available_capacity = CASE 
    WHEN status = 'free' THEN 1 
    ELSE 0 
  END,
  is_bookable = true,
  element_type = 'seat'
WHERE total_capacity IS NULL;