CREATE TABLE IF NOT EXISTS producer_interest_submissions (
  id serial PRIMARY KEY,
  business_name varchar(255) NOT NULL,
  contact_name varchar(255) NOT NULL,
  email varchar(320) NOT NULL,
  phone varchar(80),
  location varchar(255) NOT NULL,
  website varchar(1000),
  product_categories json NOT NULL DEFAULT '[]'::json,
  seasonality text NOT NULL DEFAULT '',
  sales_model varchar(40) NOT NULL DEFAULT 'UNKNOWN',
  fulfillment_modes json NOT NULL DEFAULT '[]'::json,
  lead_time_notes text NOT NULL DEFAULT '',
  capacity_notes text NOT NULL DEFAULT '',
  pain_point text NOT NULL DEFAULT '',
  pilot_interest varchar(20) NOT NULL DEFAULT 'YES',
  media_interest varchar(20) NOT NULL DEFAULT 'DISCUSS',
  status varchar(40) NOT NULL DEFAULT 'NEW',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS producer_interest_submissions_status_time_idx
  ON producer_interest_submissions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS producer_interest_submissions_email_time_idx
  ON producer_interest_submissions (email, created_at DESC);

CREATE OR REPLACE FUNCTION reject_producer_interest_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'producer interest submissions are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS producer_interest_submissions_reject_mutation
  ON producer_interest_submissions;

CREATE TRIGGER producer_interest_submissions_reject_mutation
BEFORE UPDATE OR DELETE ON producer_interest_submissions
FOR EACH ROW EXECUTE FUNCTION reject_producer_interest_mutation();
