-- Add creator_user_id to kitchen_notes table
ALTER TABLE kitchen_notes ADD COLUMN creator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill creator_user_id for existing notes
-- Assuming that if staff_id is present, it's also the creator_user_id
UPDATE kitchen_notes
SET creator_user_id = staff_id
WHERE staff_id IS NOT NULL;

-- If there are notes created by super_admins (where staff_id was null),
-- and we want to attribute them correctly, this would require more complex logic
-- that depends on logging or an existing relationship. For new notes,
-- the API will populate creator_user_id directly.
