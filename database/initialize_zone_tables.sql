```sql
-- Function to create zones table
CREATE OR REPLACE FUNCTION create_zones_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS zones_fanaticka_7a3x9d (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES events_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    name text,
    capacity integer NOT NULL,
    ui_shape jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Add indexes
  CREATE INDEX IF NOT EXISTS idx_zones_event_id ON zones_fanaticka_7a3x9d(event_id);
END;
$$;

-- Function to create tickets table
CREATE OR REPLACE FUNCTION create_tickets_table()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS tickets_fanaticka_7a3x9d (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id uuid NOT NULL REFERENCES zones_fanaticka_7a3x9d(id) ON DELETE CASCADE,
    ordinal integer NOT NULL,
    status text NOT NULL CHECK (status IN ('free', 'held', 'sold', 'refunded')),
    user_id uuid,
    hold_expires_at timestamptz,
    updated_at timestamptz DEFAULT now()
  );

  -- Add indexes
  CREATE INDEX IF NOT EXISTS idx_tickets_zone_status ON tickets_fanaticka_7a3x9d(zone_id, status);
  CREATE INDEX IF NOT EXISTS idx_tickets_holds ON tickets_fanaticka_7a3x9d(hold_expires_at) WHERE status = 'held';
END;
$$;

-- Function to hold seats in a zone
CREATE OR REPLACE FUNCTION hold_zone_seats(
  p_zone_id uuid,
  p_user_id uuid,
  p_quantity integer
)
RETURNS SETOF tickets_fanaticka_7a3x9d
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH chosen AS (
    SELECT id 
    FROM tickets_fanaticka_7a3x9d
    WHERE zone_id = p_zone_id 
    AND status = 'free'
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED
  )
  UPDATE tickets_fanaticka_7a3x9d t
  SET 
    status = 'held',
    user_id = p_user_id,
    hold_expires_at = now() + interval '10 minutes'
  FROM chosen
  WHERE t.id = chosen.id
  RETURNING t.*;
END;
$$;

-- Function to cleanup expired holds
CREATE OR REPLACE FUNCTION cleanup_expired_holds()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tickets_fanaticka_7a3x9d
  SET 
    status = 'free',
    user_id = NULL,
    hold_expires_at = NULL
  WHERE status = 'held'
  AND hold_expires_at < now();
END;
$$;

-- Initialize tables
SELECT create_zones_table();
SELECT create_tickets_table();
```