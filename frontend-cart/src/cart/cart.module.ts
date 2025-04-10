import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from '../order/order.module';
import { CartController } from './cart.controller';
import { CartService } from './services';
import { CartItemEntity } from './entities/cart-item.entity';
import { CartEntity } from './entities/cart.entity';
import { ProductEntity } from './entities/product.entity';
import { OrderEntity } from 'src/order/entities/order.entity';
import { UserEntity } from 'src/users/entities/users.entity';

@Module({
  imports: [
    OrderModule,
    TypeOrmModule.forFeature([
      CartEntity,
      CartItemEntity,
      ProductEntity,
      OrderEntity,
      UserEntity,
    ]),
  ],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
