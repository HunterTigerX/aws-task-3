-- Create enum type for cart status
CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');

-- Create carts table
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status cart_status NOT NULL DEFAULT 'OPEN'
);

-- Create cart_items table
CREATE TABLE cart_items (
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    count INTEGER NOT NULL CHECK (count > 0),
    PRIMARY KEY (cart_id, product_id)
);

-- Insert test data into carts
INSERT INTO carts (user_id, status) VALUES
    ('123e4567-e89b-12d3-a456-426614174000', 'OPEN'),
    ('223e4567-e89b-12d3-a456-426614174000', 'ORDERED'),
    ('323e4567-e89b-12d3-a456-426614174000', 'OPEN');

-- Insert test data into cart_items
INSERT INTO cart_items (cart_id, product_id, count) VALUES
    ((SELECT id FROM carts LIMIT 1), '423e4567-e89b-12d3-a456-426614174000', 2),
    ((SELECT id FROM carts LIMIT 1), '523e4567-e89b-12d3-a456-426614174000', 1),
    ((SELECT id FROM carts OFFSET 1 LIMIT 1), '623e4567-e89b-12d3-a456-426614174000', 3);
