-- Create a sequence for the human-readable order ID
CREATE SEQUENCE IF NOT EXISTS order_id_seq
  START 1
  INCREMENT 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Add the human_readable_id column to the orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS human_readable_id TEXT;

-- Update existing orders with a human_readable_id
-- This is a one-time operation to populate existing rows.
-- The format will be 'ORD-' followed by the existing 'id' to ensure uniqueness for old orders.
UPDATE public.orders
SET human_readable_id = 'ORD-' || substr(id::text, 1, 8)
WHERE human_readable_id IS NULL;

-- Create a function to generate the next human-readable order ID
CREATE OR REPLACE FUNCTION public.generate_order_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.human_readable_id := 'ORD-' || nextval('order_id_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate the human-readable ID for new orders
DROP TRIGGER IF EXISTS set_human_readable_order_id ON public.orders;
CREATE TRIGGER set_human_readable_order_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_id();

-- Make the human_readable_id column not nullable and unique after populating it
ALTER TABLE public.orders
ALTER COLUMN human_readable_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_human_readable_id_idx ON public.orders (human_readable_id);
