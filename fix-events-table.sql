-- Add timestamp columns with automatic updates
ALTER TABLE events_fanaticka_7a3x9d
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now() NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_events_updated_at ON events_fanaticka_7a3x9d;
CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON events_fanaticka_7a3x9d
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();