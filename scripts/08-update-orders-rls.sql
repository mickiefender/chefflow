-- Drop the existing policy
DROP POLICY IF EXISTS "Enable read access for orders" ON public.orders;

-- Create a new policy that allows public read access
CREATE POLICY "Enable public read access for orders"
  ON public.orders
  FOR SELECT
  USING (true);
