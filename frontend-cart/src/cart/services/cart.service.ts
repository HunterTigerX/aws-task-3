import { Injectable } from '@nestjs/common';
import { PutCartPayload } from 'src/order/type';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CartEntity } from '../entities/cart.entity';
import { CartItemEntity } from '../entities/cart-item.entity';
import { OrderEntity } from 'src/order/entities/order.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectDataSource()
    public dataSource: DataSource,
    @InjectRepository(CartEntity)
    private cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private cartItemRepository: Repository<CartItemEntity>,
    @InjectRepository(OrderEntity)
    private ordersRepository: Repository<OrderEntity>,
  ) {}

  async findByUserId(userId: string): Promise<CartEntity> {
    return this.cartRepository.findOne({
      where: { user_id: userId, status: 'OPEN' },
      relations: {
        items: true,
      },
    });
  }

  async createByUserId(userId: string): Promise<CartEntity> {
    const cart = this.cartRepository.create({
      user_id: userId,
      status: 'OPEN',
      items: [],
    });
    return this.cartRepository.save(cart);
  }

  async findOrCreateByUserId(userId: string): Promise<CartEntity> {
    let cart = await this.findByUserId(userId);
    if (!cart) {
      cart = await this.createByUserId(userId);
    }
    return cart;
  }

  async updateByUserId(
    userId: string,
    payload: PutCartPayload,
  ): Promise<CartEntity> {
    const cart = await this.findOrCreateByUserId(userId);

    // Находим существующий элемент корзины
    const existingItem = cart.items?.find(
      (item) => item.product_id === payload.product.id,
    );

    if (existingItem) {
      if (payload.count === 0) {
        // Удаление элемента
        await this.cartItemRepository.delete(existingItem.id);
      } else {
        // Обновление количества
        await this.cartItemRepository.update(existingItem.id, {
          count: payload.count,
        });
      }
    } else if (payload.count > 0) {
      // Создание нового элемента с фиксацией цены
      const newItem = this.cartItemRepository.create({
        cart_id: cart.id,
        product_id: payload.product.id,
        price: payload.product.price, // Фиксируем цену!
        count: payload.count,
      });
      await this.cartItemRepository.save(newItem);
    }

    // Возврат корзины с явной загрузкой items
    return this.cartRepository.findOne({
      relations: { items: true },
      where: { id: cart.id },
    });
  }

  async checkout(userId: string, orderData: object): Promise<OrderEntity> {
    const cart = await this.findByUserId(userId);

    if (!cart) {
      throw new Error('Cart does not exist.');
    }

    const newOrder = this.ordersRepository.create(orderData);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save<OrderEntity>(newOrder);
      await queryRunner.manager.update<CartEntity>(CartEntity, cart.id, {
        status: 'ORDERED',
      });

      await queryRunner.commitTransaction();

      return newOrder;
    } catch (err) {
      await queryRunner.rollbackTransaction();

      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async removeByUserId(userId: string): Promise<void> {
    const cart = await this.findByUserId(userId);
    if (cart) {
      await this.cartItemRepository.delete({ cart: { id: cart.id } });
      await this.cartRepository.delete(cart.id);
    }
  }
}
