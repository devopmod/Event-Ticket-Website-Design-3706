-- Create functions for safely updating seat statuses without triggering recursion

-- Function to insert seat status
CREATE OR REPLACE FUNCTION insert_seat_status(
  p_event_id UUID,
  p_seat_id TEXT,
  p_status TEXT,
  p_section TEXT,
  p_row INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO event_seats_fanaticka_7a3x9d (
    event_id, seat_id, status, section, row
  ) VALUES (
    p_event_id, p_seat_id, p_status, p_section, p_row
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update seat status
CREATE OR REPLACE FUNCTION update_seat_status(
  p_event_id UUID,
  p_seat_id TEXT,
  p_status TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE event_seats_fanaticka_7a3x9d
  SET status = p_status
  WHERE event_id = p_event_id AND seat_id = p_seat_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds(p_expiry_time TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE event_seats_fanaticka_7a3x9d
  SET status = 'free'
  WHERE status = 'held'
  AND created_at < p_expiry_time;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Function to add column if not exists
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  table_name TEXT,
  column_name TEXT,
  column_def TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = $1
    AND column_name = $2
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', table_name, column_name, column_def);
  END IF;
END;
$$ LANGUAGE plpgsql;