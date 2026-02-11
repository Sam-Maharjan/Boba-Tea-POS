-- Adds customer order support by adding user_id column, making employee_id 
-- nullable, and ensuring orders have either employee or customer ownership

ALTER TABLE orders 
ADD COLUMN user_id INTEGER REFERENCES users(user_id);

ALTER TABLE orders 
ALTER COLUMN employee_id DROP NOT NULL;

ALTER TABLE orders 
ADD CONSTRAINT check_order_creator 
CHECK (
    (employee_id IS NOT NULL AND user_id IS NULL) OR 
    (employee_id IS NULL AND user_id IS NOT NULL)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
