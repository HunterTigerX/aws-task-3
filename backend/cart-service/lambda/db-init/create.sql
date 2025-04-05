-- Load uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');
CREATE TYPE order_status AS ENUM ('OPEN', 'APPROVED', 'CONFIRMED', 'SENT', 'COMPLETED', 'CANCELLED');


-- Create users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create carts table
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    status cart_status DEFAULT 'OPEN' NOT NULL
);

-- Create cart_items table
CREATE TABLE cart_items (
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    count INTEGER NOT NULL CHECK (count > 0),
    price NUMERIC(10, 2) NOT NULL
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
    cart_id UUID REFERENCES carts(id) ON DELETE NO ACTION,
    payment JSONB,
    delivery JSONB,
    comments TEXT,
    status order_status DEFAULT 'OPEN' NOT NULL,
    total NUMERIC(10,2) NOT NULL
);
