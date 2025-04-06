-- Load uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
    user1_id UUID := uuid_generate_v4();
    user2_id UUID := uuid_generate_v4();
    user3_id UUID := uuid_generate_v4();
    user4_id UUID := uuid_generate_v4();
    
    productA_id UUID := uuid_generate_v4();
    productB_id UUID := uuid_generate_v4();
    productC_id UUID := uuid_generate_v4();
    productD_id UUID := uuid_generate_v4();
    
    cart1_id UUID := uuid_generate_v4();
    cart2_id UUID := uuid_generate_v4();
    cart3_id UUID := uuid_generate_v4(); 
    cart4_id UUID := uuid_generate_v4(); 

    order1_id UUID := uuid_generate_v4();
    order2_id UUID := uuid_generate_v4();
    order3_id UUID := uuid_generate_v4();

BEGIN

    -- Seed users
    INSERT INTO users (id, username, password, created_at, updated_at) VALUES
    (user1_id, 'test0@gmail.com', 'TEST_PASSWORD', '2025-03-11', '2025-03-11'),
    (user2_id, 'test1@gmail.com', 'TEST_PASSWORD', '2024-08-04', '2024-08-04'),
    (user3_id, 'test2@gmail.com', 'TEST_PASSWORD', '2024-11-05', '2024-11-05'),
    (user4_id, 'test3@gmail.com', 'TEST_PASSWORD', '2025-04-04', '2025-04-04');

    -- Insert sample products
    INSERT INTO products (id, title, description, price) VALUES
    (productA_id, 'iPhone 15', 'Latest Apple smartphone with A16 chip', 999.99),
    (productB_id, 'Samsung Galaxy S23', 'Flagship Android phone with Snapdragon 8 Gen 2', 799.99),
    (productC_id, 'MacBook Pro 14', 'Apple laptop with M2 Pro chip', 1999.00),
    (productD_id, 'Samsung Pro 17', 'Apple laptop with M3 Pro chip', 2411.00);

    -- Insert sample carts
    INSERT INTO carts (id, user_id, created_at, updated_at, status) VALUES
    (cart1_id, user1_id, '2024-12-01', '2024-12-01', 'OPEN'),
    (cart2_id, user1_id, '2025-03-11', '2024-08-04', 'ORDERED'),
    (cart3_id, user2_id, '2025-01-27', '2025-01-27', 'ORDERED'),
    (cart4_id, user3_id, '2025-02-01', '2025-02-01', 'ORDERED');

    -- Insert cart items
    INSERT INTO cart_items (cart_id, product_id, count)
    (cart1_id, productA_id, 2),
    (cart2_id, productB_id, 4),
    (cart3_id, productC_id, 6),
    (cart4_id, productD_id, 8);


-- Insert sample orders
    INSERT INTO orders (
        id, user_id, cart_id, items, payment, delivery, comments, status, total, created_at, updated_at
    ) VALUES
    (
        order1_id,
        user1_id,
        cart2_id,
        jsonb_build_array(
                jsonb_build_object('productId', productB_id::text, 'count', 2)
            ),
        jsonb_build_object('method', 'credit_card', 'amount', 1599.98),
        jsonb_build_object('address', 'Улица 1', 'city', 'Минск', 'zip', '123'),
        'Хрупкая доставка',
        'PAID',
        1599.98,
        '2024-11-05',
        '2024-12-01'
    ),
    (
        order2_id,
        user2_id,
        cart3_id,
        jsonb_build_array(
            jsonb_build_object('productId', productC_id::text, 'count', 4)
        ),
        jsonb_build_object('method', 'Смартпэй', 'email', 'user1@gmail.com', 'amount', 7996.00),
        jsonb_build_object('address', 'Улица 2', 'city', 'Минск', 'zip', '345'),
        NULL,
        'SHIPPED',
        7996.00,
        '2025-02-28',
        '2025-03-11'
    ),
    (
        order3_id,
        user3_id,
        cart4_id,
            jsonb_build_array(
            jsonb_build_object('productId', productD_id::text, 'count', 1)
        ),
        jsonb_build_object('method', 'Белвэб', 'email', 'user2@gmail.com', 'amount', 2411.00),
        jsonb_build_object('address', 'Улица 3', 'city', 'Минск2', 'zip', '456'),
        NULL,
        'SHIPPED',
        2411.00,
        '2025-02-28',
        '2025-03-11'
    );
END $$;