-- Load uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Seed users
INSERT INTO users (name, email, password)
VALUES
  ('test0', 'test@test.com', 'TEST_PASSWORD'),
  ('test1', 'test1@test.com', 'TEST_PASSWORD'),
  ('test2', 'test2@test.com', 'TEST_PASSWORD');  -- Added missing semicolon here

-- Insert sample carts
INSERT INTO carts (id, user_id, created_at, updated_at, status)
SELECT 
  uuid_generate_v4(),
  id,
  NOW() - INTERVAL '1 DAY' * RANDOM() * 10,
  NOW() - INTERVAL '1 HOUR' * RANDOM() * 24,
  CASE WHEN RANDOM() > 0.5 THEN 'OPEN'::cart_status ELSE 'ORDERED'::cart_status END
FROM users
CROSS JOIN generate_series(1, 2);

-- Insert cart items
INSERT INTO cart_items (cart_id, product_id, count, price)
SELECT
  c.id,
  uuid_generate_v4(),
  FLOOR(1 + RANDOM() * 5)::int,
  ROUND(CAST(50 + RANDOM() * 500 AS numeric), 2)
FROM carts c
CROSS JOIN generate_series(1, 3);

-- Insert sample orders
INSERT INTO orders (id, user_id, cart_id, payment, delivery, comments, status, total)
SELECT
  uuid_generate_v4(),
  c.user_id,
  c.id,
  jsonb_build_object(
    'type', 'credit_card',
    'amount', (SELECT SUM(ci.count * ci.price) FROM cart_items ci WHERE ci.cart_id = c.id),
    'transaction', md5(random()::text)
  ),
  jsonb_build_object(
    'address', 'ул. Примерная, д.' || FLOOR(10 + RANDOM() * 50),
    'city', 'Москва',
    'zip', '123' || FLOOR(RANDOM() * 100)
  ),
  CASE WHEN RANDOM() > 0.7 THEN 'Срочная доставка' END,
  'APPROVED'::order_status,
  (SELECT SUM(ci.count * ci.price) FROM cart_items ci WHERE ci.cart_id = c.id)
FROM carts c
WHERE c.status = 'ORDERED'::cart_status;

UPDATE orders o
SET total = (SELECT SUM(ci.count * ci.price) FROM cart_items ci WHERE ci.cart_id = o.cart_id);