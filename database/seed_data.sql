-- Insert default seat categories
INSERT INTO seat_categories_fanaticka_7a3x9d (name, color) VALUES
('General', '#3B82F6'),
('VIP', '#8B5CF6'),
('Premium', '#F59E0B'),
('Balcony', '#10B981'),
('Parterre', '#EC4899'),
('Standing', '#06B6D4');

-- Insert sample venue
INSERT INTO venues_fanaticka_7a3x9d (name, address, geometry_data) VALUES
('Main Concert Hall', 'Warsaw, Poland', '{
  "elements": [
    {
      "id": "stage-1",
      "type": "stage",
      "x": 300,
      "y": 50,
      "width": 200,
      "height": 40,
      "label": "STAGE"
    }
  ],
  "categories": {}
}');

-- Get category IDs for reference
DO $$
DECLARE
    general_id UUID;
    vip_id UUID;
    premium_id UUID;
    venue_id UUID;
    event_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO general_id FROM seat_categories_fanaticka_7a3x9d WHERE name = 'General';
    SELECT id INTO vip_id FROM seat_categories_fanaticka_7a3x9d WHERE name = 'VIP';
    SELECT id INTO premium_id FROM seat_categories_fanaticka_7a3x9d WHERE name = 'Premium';
    
    -- Get venue ID
    SELECT id INTO venue_id FROM venues_fanaticka_7a3x9d WHERE name = 'Main Concert Hall';
    
    -- Insert sample event
    INSERT INTO events_fanaticka_7a3x9d (venue_id, title, description, category, artist, genre, location, event_date, image)
    VALUES (
        venue_id,
        'MAX KORZH CONCERT',
        'An amazing concert by MAX KORZH with special guests',
        'concert',
        'MAX KORZH',
        'Hip-Hop',
        'Warsaw, Poland',
        '2025-08-09 20:00:00+02',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ) RETURNING id INTO event_id;
    
    -- Insert event prices
    INSERT INTO event_prices_fanaticka_7a3x9d (event_id, category_id, price, currency) VALUES
    (event_id, general_id, 45.00, 'EUR'),
    (event_id, vip_id, 85.00, 'EUR'),
    (event_id, premium_id, 120.00, 'EUR');
    
    -- Publish the event
    UPDATE events_fanaticka_7a3x9d SET published_at = now() WHERE id = event_id;
    
    RAISE NOTICE 'Sample data inserted successfully';
END $$;