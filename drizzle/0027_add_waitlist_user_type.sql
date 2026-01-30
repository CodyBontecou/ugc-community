-- Add user type to waitlist to distinguish between creators and brands
ALTER TABLE waitlist ADD COLUMN user_type text NOT NULL DEFAULT 'creator';
