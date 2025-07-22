-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to safely update seat status
CREATE OR REPLACE FUNCTION update_seat_status(
    p_event_id UUID,
    p_seat_id BIGINT, -- Changed from TEXT to BIGINT
    p_status seat_status
)
RETURNS event_seats_fanaticka_7a3x9d AS $$
DECLARE
    v_seat event_seats_fanaticka_7a3x9d;
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

    -- Update status
    UPDATE event_seats_fanaticka_7a3x9d
    SET status = p_status,
        updated_at = now()
    WHERE event_id = p_event_id AND seat_id = p_seat_id
    RETURNING *
    INTO v_seat;

    RETURN v_seat;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH expired_holds AS (
        SELECT event_id, seat_id
        FROM event_seats_fanaticka_7a3x9d
        WHERE status = 'held'
        AND updated_at < now() - interval '10 minutes'
    )
    UPDATE event_seats_fanaticka_7a3x9d es
    SET status = 'free',
        updated_at = now()
    FROM expired_holds eh
    WHERE es.event_id = eh.event_id
    AND es.seat_id = eh.seat_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH expired_reservations AS (
        DELETE FROM seat_reservations_fanaticka_7a3x9d
        WHERE expires_at < now()
        RETURNING event_id, seat_id
    )
    UPDATE event_seats_fanaticka_7a3x9d es
    SET status = 'free',
        updated_at = now()
    FROM expired_reservations er
    WHERE es.event_id = er.event_id
    AND es.seat_id = er.seat_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;