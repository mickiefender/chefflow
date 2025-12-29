-- Update RLS Policies for kitchen_notes to include super_admins

DROP POLICY IF EXISTS "Restaurant staff can see notes for their restaurant" ON kitchen_notes;
DROP POLICY IF EXISTS "Staff can insert notes for their restaurant" ON kitchen_notes;

CREATE POLICY "Staff and Super Admins can see notes for their restaurant"
  ON kitchen_notes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM staff_members WHERE id = auth.uid() AND restaurant_id = kitchen_notes.restaurant_id)
    OR
    EXISTS (SELECT 1 FROM restaurants WHERE super_admin_id = auth.uid() AND id = kitchen_notes.restaurant_id)
  );

CREATE POLICY "Staff and Super Admins can insert notes for their restaurant"
  ON kitchen_notes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE id = auth.uid() AND restaurant_id = kitchen_notes.restaurant_id)
    OR
    EXISTS (SELECT 1 FROM restaurants WHERE super_admin_id = auth.uid() AND id = kitchen_notes.restaurant_id)
  );
