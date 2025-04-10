import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from './users/entities/users.entity';
import { CartEntity } from './cart/entities/cart.entity';
import { OrderEntity } from './order/entities/order.entity';
import { CartItemEntity } from './cart/entities/cart-item.entity';
import { ProductEntity } from './cart/entities/product.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host:
    process.env.DB_HOST || 'cartdb.czwk442a8alq.eu-central-1.rds.amazonaws.com',
  port: Number(process.env.PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'cartdb',
  entities: [
    UserEntity,
    CartEntity,
    OrderEntity,
    CartItemEntity,
    ProductEntity,
  ],
  synchronize: true, // Set to false in production
  logging: true,
  ssl: {
    rejectUnauthorized: false, // For RDS SSL
  },
};
