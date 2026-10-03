CREATE TABLE IF NOT EXISTS market_requests (
  id serial PRIMARY KEY,
  request_key varchar(64) NOT NULL,
  title varchar(120) NOT NULL,
  category varchar(30) NOT NULL DEFAULT 'product',
  note text NOT NULL DEFAULT '',
  request_count integer NOT NULL DEFAULT 1,
  status varchar(30) NOT NULL DEFAULT 'REQUESTED',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS market_requests_request_key_idx
  ON market_requests (request_key);
