-- Drop all old tables first
DROP TABLE IF EXISTS event_seats_fanaticka_7a3x9d CASCADE;
DROP TABLE IF EXISTS seat_reservations_fanaticka_7a3x9d CASCADE;
DROP TABLE IF EXISTS seat_purchases_fanaticka_7a3x9d CASCADE;
DROP TABLE IF EXISTS zones_fanaticka_7a3x9d CASCADE;
DROP TABLE IF EXISTS tickets_fanaticka_7a3x9d CASCADE;
DROP TABLE IF EXISTS events_fanaticka_7a3x9d CASCADE;
DROP TABLE IF EXISTS venues_fanaticka_7a3x9d CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS seat_status CASCADE;

-- Create new enums
CREATE TYPE ticket_status AS ENUM ('free', 'held', 'sold');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'refunded', 'cancelled');
CREATE TYPE event_category AS ENUM ('concert', 'party', 'bustour');

-- Create seat_categories table (🎨 «VIP», «GEN», …)
CREATE TABLE seat_categories_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL, -- HEX color for map
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create venues table (🏟 здание / сцена)
CREATE TABLE venues_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    geometry_data JSONB NOT NULL DEFAULT '{}', -- Canvas всего зала
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create events table (📅 одно мероприятие)
CREATE TABLE events_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues_fanaticka_7a3x9d(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category event_category NOT NULL DEFAULT 'concert',
    artist TEXT,
    genre TEXT,
    location TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    image TEXT, -- URL / base64
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create event_prices table (💰 цены категории-на-ивент)
CREATE TABLE event_prices_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES seat_categories_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(event_id, category_id)
);

-- Create zones table (📐 фан-зона или сектор)
CREATE TABLE zones_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES seat_categories_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0), -- общий лимит
    ui_shape JSONB NOT NULL DEFAULT '{}', -- poly-line
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create single_seats table (💺 каждое кресло)
CREATE TABLE single_seats_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones_fanaticka_7a3x9d(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES seat_categories_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    row_number INTEGER,
    seat_number INTEGER,
    section TEXT,
    x NUMERIC NOT NULL,
    y NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_meta table (👤 профиль)
CREATE TABLE user_meta_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table (🧾 заказ пользователя)
CREATE TABLE orders_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_meta_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    status order_status NOT NULL DEFAULT 'pending',
    total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create order_items table (📦 конкретный билет в заказе)
CREATE TABLE order_items_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tickets table (🎫 «место × ивент»)
CREATE TABLE tickets_fanaticka_7a3x9d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones_fanaticka_7a3x9d(id) ON DELETE SET NULL,
    seat_id UUID REFERENCES single_seats_fanaticka_7a3x9d(id) ON DELETE SET NULL,
    status ticket_status NOT NULL DEFAULT 'free',
    hold_expires_at TIMESTAMPTZ,
    order_item_id UUID REFERENCES order_items_fanaticka_7a3x9d(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Either zone_id or seat_id must be set, but not both
    CHECK ((zone_id IS NOT NULL AND seat_id IS NULL) OR (zone_id IS NULL AND seat_id IS NOT NULL))
);

-- Create indexes for performance
CREATE INDEX idx_events_venue_id ON events_fanaticka_7a3x9d(venue_id);
CREATE INDEX idx_events_event_date ON events_fanaticka_7a3x9d(event_date);
CREATE INDEX idx_events_published ON events_fanaticka_7a3x9d(published_at) WHERE published_at IS NOT NULL;

CREATE INDEX idx_event_prices_event_id ON event_prices_fanaticka_7a3x9d(event_id);
CREATE INDEX idx_event_prices_category_id ON event_prices_fanaticka_7a3x9d(category_id);

CREATE INDEX idx_zones_venue_id ON zones_fanaticka_7a3x9d(venue_id);
CREATE INDEX idx_zones_category_id ON zones_fanaticka_7a3x9d(category_id);

CREATE INDEX idx_single_seats_venue_id ON single_seats_fanaticka_7a3x9d(venue_id);
CREATE INDEX idx_single_seats_zone_id ON single_seats_fanaticka_7a3x9d(zone_id);
CREATE INDEX idx_single_seats_category_id ON single_seats_fanaticka_7a3x9d(category_id);

CREATE INDEX idx_tickets_event_id ON tickets_fanaticka_7a3x9d(event_id);
CREATE INDEX idx_tickets_zone_id ON tickets_fanaticka_7a3x9d(zone_id);
CREATE INDEX idx_tickets_seat_id ON tickets_fanaticka_7a3x9d(seat_id);
CREATE INDEX idx_tickets_status ON tickets_fanaticka_7a3x9d(status);
CREATE INDEX idx_tickets_hold_expires ON tickets_fanaticka_7a3x9d(hold_expires_at) WHERE status = 'held';

CREATE INDEX idx_orders_user_id ON orders_fanaticka_7a3x9d(user_id);
CREATE INDEX idx_orders_status ON orders_fanaticka_7a3x9d(status);

CREATE INDEX idx_order_items_order_id ON order_items_fanaticka_7a3x9d(order_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_seat_categories_updated_at BEFORE UPDATE ON seat_categories_fanaticka_7a3x9d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues_fanaticka_7a3x9d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events_fanaticka_7a3x9d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_prices_updated_at BEFORE UPDATE ON event_prices_fanaticka_7a3x9d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones_fanaticka_7a3x9d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_single_seats_updated_at BEFORE UPDATE ON single_seats_fanaticka_7a3x9d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_meta_updated_at BEFORE UPDATE ON user_meta_fanaticka_7a3x9d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders_fanaticka_7a3x9d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items_fanaticka_7a3x9d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets_fanaticka_7a3x9d FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE seat_categories_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_prices_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE single_seats_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meta_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_fanaticka_7a3x9d ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access" ON seat_categories_fanaticka_7a3x9d FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON venues_fanaticka_7a3x9d FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON events_fanaticka_7a3x9d FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON event_prices_fanaticka_7a3x9d FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON zones_fanaticka_7a3x9d FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON single_seats_fanaticka_7a3x9d FOR SELECT TO public USING (true);
CREATE POLICY "Public read access" ON tickets_fanaticka_7a3x9d FOR SELECT TO public USING (true);

-- Allow public insert/update for tickets (for seat selection)
CREATE POLICY "Allow ticket updates" ON tickets_fanaticka_7a3x9d FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Allow public insert for user_meta, orders, order_items (for checkout)
CREATE POLICY "Allow user creation" ON user_meta_fanaticka_7a3x9d FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow order creation" ON orders_fanaticka_7a3x9d FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow order item creation" ON order_items_fanaticka_7a3x9d FOR INSERT TO public WITH CHECK (true);

-- Admin policies (full access)
CREATE POLICY "Admin full access" ON seat_categories_fanaticka_7a3x9d FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON venues_fanaticka_7a3x9d FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON events_fanaticka_7a3x9d FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON event_prices_fanaticka_7a3x9d FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON zones_fanaticka_7a3x9d FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON single_seats_fanaticka_7a3x9d FOR ALL TO public USING (true) WITH CHECK (true);