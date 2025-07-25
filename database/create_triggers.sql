-- Trigger for updating updated_at timestamp on events
CREATE TRIGGER set_events_updated_at
    BEFORE UPDATE ON events_fanaticka_7a3x9d
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger for updating updated_at timestamp on venues
CREATE TRIGGER set_venues_updated_at
    BEFORE UPDATE ON venues_fanaticka_7a3x9d
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger for updating updated_at timestamp on event seats
CREATE TRIGGER set_event_seats_updated_at
    BEFORE UPDATE ON event_seats_fanaticka_7a3x9d
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Enable row level security
ALTER TABLE events_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_seats_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_reservations_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_purchases_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access" ON events_fanaticka_7a3x9d
    FOR SELECT TO public
    USING (true);

CREATE POLICY "Public read access" ON venues_fanaticka_7a3x9d
    FOR SELECT TO public
    USING (true);

CREATE POLICY "Public read access" ON event_seats_fanaticka_7a3x9d
    FOR SELECT TO public
    USING (true);

CREATE POLICY "Allow seat status updates" ON event_seats_fanaticka_7a3x9d
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow reservations" ON seat_reservations_fanaticka_7a3x9d
    FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY "Allow purchases" ON seat_purchases_fanaticka_7a3x9d
    FOR INSERT TO public
    WITH CHECK (true);