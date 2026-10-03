CREATE TABLE IF NOT EXISTS era_archive_snapshots (
  id serial PRIMARY KEY,
  era_id integer NOT NULL,
  snapshot_kind varchar(40) NOT NULL DEFAULT 'CLOSURE',
  snapshot_digest varchar(64) NOT NULL UNIQUE,
  snapshot json NOT NULL,
  evidence_ref varchar(1500) NOT NULL,
  actor varchar(120) NOT NULL DEFAULT 'owner',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS era_archive_snapshots_digest_idx
  ON era_archive_snapshots (snapshot_digest);

CREATE INDEX IF NOT EXISTS era_archive_snapshots_era_created_idx
  ON era_archive_snapshots (era_id, created_at);

CREATE OR REPLACE FUNCTION reject_era_archive_snapshot_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'era_archive_snapshots are immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS era_archive_snapshots_reject_update
  ON era_archive_snapshots;
CREATE TRIGGER era_archive_snapshots_reject_update
BEFORE UPDATE ON era_archive_snapshots
FOR EACH ROW EXECUTE FUNCTION reject_era_archive_snapshot_mutation();

DROP TRIGGER IF EXISTS era_archive_snapshots_reject_delete
  ON era_archive_snapshots;
CREATE TRIGGER era_archive_snapshots_reject_delete
BEFORE DELETE ON era_archive_snapshots
FOR EACH ROW EXECUTE FUNCTION reject_era_archive_snapshot_mutation();

ALTER TABLE customer_alert_events
  ADD COLUMN IF NOT EXISTS signal_key varchar(255),
  ADD COLUMN IF NOT EXISTS fingerprint varchar(64),
  ADD COLUMN IF NOT EXISTS evidence_ref varchar(1500);

UPDATE customer_alert_events
SET
  signal_key = COALESCE(signal_key, 'legacy-' || id::text),
  fingerprint = COALESCE(
    fingerprint,
    md5('legacy-alert-' || id::text)
  )
WHERE signal_key IS NULL OR fingerprint IS NULL;

ALTER TABLE customer_alert_events
  ALTER COLUMN signal_key SET NOT NULL,
  ALTER COLUMN fingerprint SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customer_alert_events_fingerprint_idx
  ON customer_alert_events (fingerprint);
