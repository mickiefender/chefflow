-- Add 'type' to menu_categories to distinguish between food and drink
ALTER TABLE menu_categories ADD COLUMN type TEXT;

-- Add stock management columns to menu_items
ALTER TABLE menu_items ADD COLUMN quantity_in_stock INTEGER;
ALTER TABLE menu_items ADD COLUMN low_stock_threshold INTEGER;

-- Add preparation time tracking to orders
ALTER TABLE orders ADD COLUMN preparation_started_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN preparation_completed_at TIMESTAMP;

-- Create kitchen_notes table
CREATE TABLE IF NOT EXISTS kitchen_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for kitchen_notes
ALTER TABLE kitchen_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kitchen_notes
CREATE POLICY "Restaurant staff can see notes for their restaurant"
  ON kitchen_notes FOR SELECT
  USING (restaurant_id IN (SELECT restaurant_id FROM staff_members WHERE id = auth.uid()));

CREATE POLICY "Staff can insert notes for their restaurant"
  ON kitchen_notes FOR INSERT
  WITH CHECK (restaurant_id IN (SELECT restaurant_id FROM staff_members WHERE id = auth.uid()));

-- Update RLS policy for menu_items to allow staff to update them
CREATE POLICY "Staff can update menu items in their restaurant"
  ON menu_items FOR UPDATE
  USING (restaurant_id IN (SELECT restaurant_id FROM staff_members WHERE id = auth.uid()));
