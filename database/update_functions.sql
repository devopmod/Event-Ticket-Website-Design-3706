-- Update functions to work with capacity-based seats

-- Function to update seat status with capacity support
CREATE OR REPLACE FUNCTION update_seat_status_with_capacity(
  p_event_id UUID,
  p_seat_id TEXT,
  p_status seat_status,
  p_quantity INTEGER DEFAULT 1
) RETURNS event_seats_fanaticka_7a3x9d AS $$
DECLARE
  v_seat event_seats_fanaticka_7a3x9d;
  v_new_available_capacity INTEGER;
  v_new_status seat_status;
BEGIN
  -- Get current seat status with row lock
  SELECT * INTO v_seat
  FROM event_seats_fanaticka_7a3x9d
  WHERE event_id = p_event_id AND seat_id = p_seat_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seat not found';
  END IF;

  -- Validate status transition
  IF v_seat.status = 'sold' AND p_status != 'sold' THEN
    RAISE EXCEPTION 'Cannot change status of sold seat';
  END IF;

  -- Calculate new available capacity based on action
  IF p_status = 'held' THEN
    -- Reserve seats
    IF v_seat.available_capacity < p_quantity THEN
      RAISE EXCEPTION 'Not enough seats available';
    END IF;
    v_new_available_capacity := v_seat.available_capacity - p_quantity;
  ELSIF p_status = 'free' THEN
    -- Release seats
    v_new_available_capacity := LEAST(v_seat.available_capacity + p_quantity, v_seat.total_capacity);
  ELSIF p_status = 'sold' THEN
    -- Sold seats (capacity doesn't change, just status)
    v_new_available_capacity := v_seat.available_capacity;
  ELSE
    v_new_available_capacity := v_seat.available_capacity;
  END IF;

  -- Determine new status based on available capacity
  IF v_new_available_capacity = 0 THEN
    v_new_status := p_status;
  ELSIF v_new_available_capacity = v_seat.total_capacity THEN
    v_new_status := 'free';
  ELSE
    v_new_status := p_status;
  END IF;

  -- Update seat
  UPDATE event_seats_fanaticka_7a3x9d
  SET 
    status = v_new_status,
    available_capacity = v_new_available_capacity,
    updated_at = now()
  WHERE event_id = p_event_id AND seat_id = p_seat_id
  RETURNING * INTO v_seat;

  RETURN v_seat;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired holds with capacity support
CREATE OR REPLACE FUNCTION cleanup_expired_holds_with_capacity() RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH expired_holds AS (
    SELECT event_id, seat_id, total_capacity
    FROM event_seats_fanaticka_7a3x9d
    WHERE status = 'held' 
    AND updated_at < now() - interval '10 minutes'
  )
  UPDATE event_seats_fanaticka_7a3x9d es
  SET 
    status = 'free',
    available_capacity = total_capacity,
    updated_at = now()
  FROM expired_holds eh
  WHERE es.event_id = eh.event_id AND es.seat_id = eh.seat_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get seat availability summary
CREATE OR REPLACE FUNCTION get_seat_availability_summary(p_event_id UUID)
RETURNS TABLE(
  total_seats BIGINT,
  available_seats BIGINT,
  held_seats BIGINT,
  sold_seats BIGINT,
  bookable_seats BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(total_capacity) as total_seats,
    SUM(available_capacity) as available_seats,
    SUM(CASE WHEN status = 'held' THEN total_capacity - available_capacity ELSE 0 END) as held_seats,
    SUM(CASE WHEN status = 'sold' THEN total_capacity - available_capacity ELSE 0 END) as sold_seats,
    SUM(CASE WHEN is_bookable THEN total_capacity ELSE 0 END) as bookable_seats
  FROM event_seats_fanaticka_7a3x9d
  WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;