CREATE OR REPLACE FUNCTION get_orders_by_department_type(
    p_restaurant_id UUID,
    p_department_type TEXT
)
RETURNS SETOF orders AS $$
BEGIN
    RETURN QUERY
    SELECT o.*
    FROM orders o
    WHERE o.restaurant_id = p_restaurant_id
      AND EXISTS (
          SELECT 1
          FROM order_items oi
          JOIN menu_items mi ON oi.menu_item_id = mi.id
          JOIN menu_categories mc ON mi.category_id = mc.id
          WHERE oi.order_id = o.id
            AND mc.type = p_department_type
      );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_stock(
    p_menu_item_id UUID,
    p_quantity INTEGER
)
RETURNS void AS $$
BEGIN
    UPDATE menu_items
    SET quantity_in_stock = quantity_in_stock - p_quantity
    WHERE id = p_menu_item_id;
END;
$$ LANGUAGE plpgsql;
