-- Create enum for seat status
CREATE TYPE seat_status AS ENUM ('free', 'held', 'sold');

-- Events table
CREATE TABLE IF NOT EXISTS events_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('concert', 'party', 'bustour')),
    date TEXT NOT NULL, -- Formatted date string for display
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    artist TEXT,
    genre TEXT,
    image TEXT,
    venue_id UUID REFERENCES venues_fanaticka_7a3x9d(id),
    price_book JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    canvas_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Event seats table
-- Changed seat_id to BIGINT as it's a natural number
CREATE TABLE IF NOT EXISTS event_seats_fanaticka_7a3x9d (
    event_id UUID REFERENCES events_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    seat_id BIGINT NOT NULL, -- Changed from TEXT to BIGINT
    status seat_status NOT NULL DEFAULT 'free',
    section TEXT NOT NULL,
    row INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (event_id, seat_id)
);

-- Seat reservations table
CREATE TABLE IF NOT EXISTS seat_reservations_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    seat_id BIGINT NOT NULL, -- Changed from TEXT to BIGINT
    customer_email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (event_id, seat_id) REFERENCES event_seats_fanaticka_7a3x9d(event_id, seat_id)
);

-- Seat purchases table
CREATE TABLE IF NOT EXISTS seat_purchases_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    seat_id BIGINT NOT NULL, -- Changed from TEXT to BIGINT
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    purchase_price NUMERIC(10,2) NOT NULL CHECK (purchase_price >= 0),
    payment_method TEXT NOT NULL,
    purchased_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (event_id, seat_id) REFERENCES event_seats_fanaticka_7a3x9d(event_id, seat_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_seats_status ON event_seats_fanaticka_7a3x9d(status);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_expires ON seat_reservations_fanaticka_7a3x9d(expires_at);
CREATE INDEX IF NOT EXISTS idx_events_date ON events_fanaticka_7a3x9d(event_date);
CREATE INDEX IF NOT EXISTS idx_events_venue ON events_fanaticka_7a3x9d(venue_id);