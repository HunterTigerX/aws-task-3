import { Injectable } from '@nestjs/common';
// import { randomUUID } from 'node:crypto';
// import { Cart, CartStatuses } from '../models';
import { PutCartPayload } from 'src/order/type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartEntity } from '../entities/cart.entity';
import { CartItemEntity } from '../entities/cart-item.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private cartRepository: Repository<CartEntity>,
    @InjectRepository(CartItemEntity)
    private cartItemRepository: Repository<CartItemEntity>,
  ) {}

  async findByUserId(userId: string): Promise<CartEntity> {
    return this.cartRepository.findOne({
      where: { user_id: userId },
      relations: ['items', 'items.product'],
    });
  }

  async createByUserId(userId: string): Promise<CartEntity> {
    const cart = this.cartRepository.create({
      user_id: userId,
      status: 'OPEN',
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

    // Find existing item
    const existingItem = cart.items.find(
      (item) => item.product.id === payload.product.id,
    );

    if (existingItem) {
      if (payload.count === 0) {
        await this.cartItemRepository.remove(existingItem);
      } else {
        existingItem.count = payload.count;
        await this.cartItemRepository.save(existingItem);
      }
    } else if (payload.count > 0) {
      const newItem = this.cartItemRepository.create({
        cart,
        product: payload.product,
        count: payload.count,
      });
      await this.cartItemRepository.save(newItem);
    }

    return this.findByUserId(userId);
  }

  async removeByUserId(userId: string): Promise<void> {
    const cart = await this.findByUserId(userId);
    if (cart) {
      await this.cartItemRepository.delete({ cart: { id: cart.id } });
      await this.cartRepository.delete(cart.id);
    }
  }
}
