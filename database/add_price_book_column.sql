-- Add price_book column to events table
ALTER TABLE events_fanaticka_7a3x9d 
ADD COLUMN IF NOT EXISTS price_book JSONB DEFAULT '{}';

-- Create index for price_book queries
CREATE INDEX IF NOT EXISTS idx_events_price_book ON events_fanaticka_7a3x9d USING GIN (price_book);

-- Add comment
COMMENT ON COLUMN events_fanaticka_7a3x9d.price_book IS 'JSONB object storing category prices for the event';