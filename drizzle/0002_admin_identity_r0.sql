CREATE TABLE IF NOT EXISTS admin_users (
  id serial PRIMARY KEY,
  username varchar(120) NOT NULL DEFAULT 'owner' UNIQUE,
  role varchar(30) NOT NULL DEFAULT 'owner',
  password_salt varchar(255) NOT NULL,
  password_hash varchar(255) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
