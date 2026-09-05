-- Keeps `updated_at` authoritative in the database rather than relying only on
-- Drizzle's `$onUpdateFn`, so a row touched by psql, a migration or a future Edge
-- Function is still stamped correctly.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
-- Applied to every table that actually has the column, so the list cannot drift out of
-- step with the schema at the time of this migration.
DO $$
DECLARE
  target text;
BEGIN
  FOR target IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', target);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      target
    );
  END LOOP;
END $$;
