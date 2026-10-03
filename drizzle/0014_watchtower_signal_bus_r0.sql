CREATE TABLE IF NOT EXISTS watchtower_signals (
  id serial PRIMARY KEY,
  signal_key varchar(255) NOT NULL UNIQUE,
  signal_type varchar(80) NOT NULL,
  subject_type varchar(40) NOT NULL,
  subject_key varchar(255) NOT NULL,
  truth_state varchar(30) NOT NULL DEFAULT 'OBSERVED',
  source_kind varchar(60) NOT NULL,
  evidence_ref varchar(1500) NOT NULL,
  observed_at timestamp NOT NULL,
  expires_at timestamp,
  public_payload json NOT NULL DEFAULT '{}'::json,
  private_payload json NOT NULL DEFAULT '{}'::json,
  payload_digest varchar(64) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS watchtower_signals_subject_observed_idx
  ON watchtower_signals (subject_type, subject_key, observed_at);

CREATE INDEX IF NOT EXISTS watchtower_signals_type_observed_idx
  ON watchtower_signals (signal_type, observed_at);

CREATE TABLE IF NOT EXISTS watchtower_signal_projections (
  id serial PRIMARY KEY,
  signal_id integer NOT NULL,
  projector varchar(100) NOT NULL,
  projection_key varchar(255) NOT NULL UNIQUE,
  result json NOT NULL DEFAULT '{}'::json,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT watchtower_signal_projections_signal_projector_unique
    UNIQUE (signal_id, projector)
);

CREATE OR REPLACE FUNCTION reject_watchtower_signal_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'watchtower signals and projections are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS watchtower_signals_reject_update
  ON watchtower_signals;
CREATE TRIGGER watchtower_signals_reject_update
BEFORE UPDATE OR DELETE ON watchtower_signals
FOR EACH ROW EXECUTE FUNCTION reject_watchtower_signal_mutation();

DROP TRIGGER IF EXISTS watchtower_signal_projections_reject_update
  ON watchtower_signal_projections;
CREATE TRIGGER watchtower_signal_projections_reject_update
BEFORE UPDATE OR DELETE ON watchtower_signal_projections
FOR EACH ROW EXECUTE FUNCTION reject_watchtower_signal_mutation();
