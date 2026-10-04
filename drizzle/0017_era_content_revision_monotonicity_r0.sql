-- AE-LRP-R0-FRC-03 remediation:
-- Make eras.content_revision monotonic and non-neutralizable at the database
-- boundary. Direct SQL may advance or no-op the revision, but may never lower
-- it or restore an earlier value. Snapshot-field and child triggers may still
-- advance it transactionally.

ALTER TABLE eras
  ADD CONSTRAINT eras_content_revision_nonnegative
  CHECK (content_revision >= 0);

CREATE OR REPLACE FUNCTION enforce_era_content_revision_monotonic()
RETURNS trigger AS $$
BEGIN
  IF NEW.content_revision < OLD.content_revision THEN
    RAISE EXCEPTION 'ERA_CONTENT_REVISION_REGRESSION'
      USING ERRCODE = '23514',
            DETAIL = format(
              'eras.id=%s content_revision cannot decrease from %s to %s',
              OLD.id,
              OLD.content_revision,
              NEW.content_revision
            );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS eras_enforce_content_revision_monotonic ON eras;
CREATE TRIGGER eras_enforce_content_revision_monotonic
BEFORE UPDATE OF content_revision
ON eras
FOR EACH ROW
EXECUTE FUNCTION enforce_era_content_revision_monotonic();
