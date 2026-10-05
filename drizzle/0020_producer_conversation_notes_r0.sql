CREATE TABLE IF NOT EXISTS producer_conversation_notes (
  id serial PRIMARY KEY,
  producer_id integer,
  interest_submission_id integer,
  business_name varchar(255) NOT NULL,
  contact_name varchar(255) NOT NULL DEFAULT '',
  contact_method varchar(40) NOT NULL DEFAULT 'PHONE',
  conversation_stage varchar(40) NOT NULL DEFAULT 'INTRO',
  answers json NOT NULL DEFAULT '{}'::json,
  operator_summary text NOT NULL DEFAULT '',
  next_step text NOT NULL DEFAULT '',
  pilot_recommendation varchar(30) NOT NULL DEFAULT 'UNDECIDED',
  evidence_refs json NOT NULL DEFAULT '[]'::json,
  actor varchar(120) NOT NULL DEFAULT 'owner',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS producer_conversation_notes_business_time_idx
  ON producer_conversation_notes (business_name, created_at DESC);

CREATE INDEX IF NOT EXISTS producer_conversation_notes_producer_time_idx
  ON producer_conversation_notes (producer_id, created_at DESC);

CREATE OR REPLACE FUNCTION reject_producer_conversation_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'producer conversation notes are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS producer_conversation_notes_reject_mutation
  ON producer_conversation_notes;

CREATE TRIGGER producer_conversation_notes_reject_mutation
BEFORE UPDATE OR DELETE ON producer_conversation_notes
FOR EACH ROW EXECUTE FUNCTION reject_producer_conversation_mutation();
