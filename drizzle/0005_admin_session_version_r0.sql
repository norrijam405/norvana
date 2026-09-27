-- Session version lets a password change invalidate every previously issued
-- owner browser session. Existing owners begin at version 1.
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1;
