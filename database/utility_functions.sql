-- Function to cleanup expired holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE tickets_fanaticka_7a3x9d
    SET status = 'free',
        hold_expires_at = NULL,
        updated_at = now()
    WHERE status = 'held'
      AND hold_expires_at < now();
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate tickets for an event
CREATE OR REPLACE FUNCTION generate_event_tickets(p_event_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_venue_id UUID;
    v_zone_record RECORD;
    v_seat_record RECORD;
    tickets_created INTEGER := 0;
BEGIN
    -- Get venue ID for the event
    SELECT venue_id INTO v_venue_id 
    FROM events_fanaticka_7a3x9d 
    WHERE id = p_event_id;
    
    IF v_venue_id IS NULL THEN
        RAISE EXCEPTION 'Event has no venue assigned';
    END IF;
    
    -- Generate tickets for zones (capacity-based seating)
    FOR v_zone_record IN 
        SELECT id, capacity 
        FROM zones_fanaticka_7a3x9d 
        WHERE venue_id = v_venue_id
    LOOP
        -- Insert tickets for zone capacity
        INSERT INTO tickets_fanaticka_7a3x9d (event_id, zone_id, status)
        SELECT p_event_id, v_zone_record.id, 'free'
        FROM generate_series(1, v_zone_record.capacity);
        
        tickets_created := tickets_created + v_zone_record.capacity;
    END LOOP;
    
    -- Generate tickets for individual seats
    FOR v_seat_record IN 
        SELECT id 
        FROM single_seats_fanaticka_7a3x9d 
        WHERE venue_id = v_venue_id
    LOOP
        INSERT INTO tickets_fanaticka_7a3x9d (event_id, seat_id, status)
        VALUES (p_event_id, v_seat_record.id, 'free');
        
        tickets_created := tickets_created + 1;
    END LOOP;
    
    RETURN tickets_created;
END;
$$ LANGUAGE plpgsql;

-- Function to hold tickets
CREATE OR REPLACE FUNCTION hold_tickets(
    p_event_id UUID,
    p_ticket_ids UUID[],
    p_hold_duration_minutes INTEGER DEFAULT 10
)
RETURNS INTEGER AS $$
DECLARE
    hold_count INTEGER;
    hold_expires TIMESTAMPTZ;
BEGIN
    hold_expires := now() + (p_hold_duration_minutes || ' minutes')::INTERVAL;
    
    UPDATE tickets_fanaticka_7a3x9d
    SET status = 'held',
        hold_expires_at = hold_expires,
        updated_at = now()
    WHERE id = ANY(p_ticket_ids)
      AND event_id = p_event_id
      AND status = 'free';
    
    GET DIAGNOSTICS hold_count = ROW_COUNT;
    
    RETURN hold_count;
END;
$$ LANGUAGE plpgsql;

-- Function to release held tickets
CREATE OR REPLACE FUNCTION release_tickets(
    p_event_id UUID,
    p_ticket_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
    release_count INTEGER;
BEGIN
    UPDATE tickets_fanaticka_7a3x9d
    SET status = 'free',
        hold_expires_at = NULL,
        updated_at = now()
    WHERE id = ANY(p_ticket_ids)
      AND event_id = p_event_id
      AND status = 'held';
    
    GET DIAGNOSTICS release_count = ROW_COUNT;
    
    RETURN release_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get event statistics
CREATE OR REPLACE FUNCTION get_event_statistics(p_event_id UUID)
RETURNS TABLE (
    total_tickets INTEGER,
    free_tickets INTEGER,
    held_tickets INTEGER,
    sold_tickets INTEGER,
    occupancy_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tickets,
        COUNT(*) FILTER (WHERE status = 'free')::INTEGER as free_tickets,
        COUNT(*) FILTER (WHERE status = 'held')::INTEGER as held_tickets,
        COUNT(*) FILTER (WHERE status = 'sold')::INTEGER as sold_tickets,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'sold')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as occupancy_rate
    FROM tickets_fanaticka_7a3x9d
    WHERE event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;