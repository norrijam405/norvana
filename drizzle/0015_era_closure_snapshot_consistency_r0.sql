-- AE-LRP-R0-FRC-01 remediation:
-- Make every closure-snapshot contributor participate in one Era-level
-- monotonic content revision. closeEra CASes this revision, so a concurrent
-- mutation either commits first and invalidates closure, or waits behind the
-- closure Era-row update and commits only after closure.

ALTER TABLE eras
  ADD COLUMN IF NOT EXISTS content_revision integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION bump_era_content_revision(target_era_id integer)
RETURNS void AS $$
BEGIN
  IF target_era_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE eras
     SET content_revision = content_revision + 1
   WHERE id = target_era_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION bump_era_content_revision_from_child()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM bump_era_content_revision(NEW.era_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM bump_era_content_revision(OLD.era_id);
    RETURN OLD;
  END IF;

  PERFORM bump_era_content_revision(OLD.era_id);
  IF NEW.era_id IS DISTINCT FROM OLD.era_id THEN
    PERFORM bump_era_content_revision(NEW.era_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS era_products_bump_content_revision ON era_products;
CREATE TRIGGER era_products_bump_content_revision
BEFORE INSERT OR UPDATE OR DELETE ON era_products
FOR EACH ROW EXECUTE FUNCTION bump_era_content_revision_from_child();

DROP TRIGGER IF EXISTS era_sections_bump_content_revision ON era_sections;
CREATE TRIGGER era_sections_bump_content_revision
BEFORE INSERT OR UPDATE OR DELETE ON era_sections
FOR EACH ROW EXECUTE FUNCTION bump_era_content_revision_from_child();

DROP TRIGGER IF EXISTS era_media_assets_bump_content_revision ON era_media_assets;
CREATE TRIGGER era_media_assets_bump_content_revision
BEFORE INSERT OR UPDATE OR DELETE ON era_media_assets
FOR EACH ROW EXECUTE FUNCTION bump_era_content_revision_from_child();

DROP TRIGGER IF EXISTS era_watchtower_bindings_bump_content_revision ON era_watchtower_bindings;
CREATE TRIGGER era_watchtower_bindings_bump_content_revision
BEFORE INSERT OR UPDATE OR DELETE ON era_watchtower_bindings
FOR EACH ROW EXECUTE FUNCTION bump_era_content_revision_from_child();

CREATE OR REPLACE FUNCTION bump_era_content_revision_from_product()
RETURNS trigger AS $$
DECLARE
  target_era_id integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    FOR target_era_id IN
      SELECT DISTINCT ep.era_id
        FROM era_products ep
       WHERE ep.product_id = OLD.id
       ORDER BY ep.era_id
    LOOP
      PERFORM bump_era_content_revision(target_era_id);
    END LOOP;
    RETURN OLD;
  END IF;

  FOR target_era_id IN
    SELECT DISTINCT ep.era_id
      FROM era_products ep
     WHERE ep.product_id = OLD.id OR ep.product_id = NEW.id
     ORDER BY ep.era_id
  LOOP
    PERFORM bump_era_content_revision(target_era_id);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_bump_era_content_revision ON products;
CREATE TRIGGER products_bump_era_content_revision
BEFORE UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION bump_era_content_revision_from_product();
