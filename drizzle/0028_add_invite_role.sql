-- Add role to invites to determine what role the invited user should have
ALTER TABLE invites ADD COLUMN role text NOT NULL DEFAULT 'creator';
