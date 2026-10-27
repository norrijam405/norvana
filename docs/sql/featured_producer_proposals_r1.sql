CREATE TABLE IF NOT EXISTS public.featured_producer_proposals (
  id serial PRIMARY KEY,
  business_name varchar(160) NOT NULL,
  region varchar(160) NOT NULL,
  category varchar(40) NOT NULL,
  story text NOT NULL DEFAULT '',
  contact_email varchar(320),
  media_rights varchar(40) NOT NULL DEFAULT 'UNVERIFIED',
  sponsorship varchar(40) NOT NULL DEFAULT 'EDITORIAL_UNPAID',
  status varchar(40) NOT NULL DEFAULT 'DRAFT',
  created_at timestamp NOT NULL DEFAULT now()
);
-- Private proposals only. No public select or publication route exists.
