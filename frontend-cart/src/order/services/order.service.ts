import { Injectable } from '@nestjs/common';
import { CreateOrderPayload } from '../type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private ordersRepository: Repository<OrderEntity>,
  ) {}

  async getAll(): Promise<OrderEntity[]> {
    return this.ordersRepository.find({
      relations: {
        cart: { items: true },
      },
    });
  }

  async findById(orderId: string): Promise<OrderEntity> {
    return this.ordersRepository.findOne({
      relations: {
        cart: { items: true },
      },
      where: { id: orderId },
    });
  }

  async create(userId: string, data: CreateOrderPayload): Promise<OrderEntity> {
    return await this.ordersRepository.save({
      user_id: userId,
      cart_id: data.cart_id,
      delivery: data.address,
      total: data.total,
    });
  }

  // TODO add  type
  async update(orderId: string, data: OrderEntity) {
    const order = this.findById(orderId);

    if (!order) {
      throw new Error('Order does not exist.');
    }

    const newOrder = { ...order, ...data };

    await this.ordersRepository.update(orderId, newOrder);

    return newOrder;
  }

  async delete(orderId: string): Promise<OrderEntity> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });
    await this.ordersRepository.delete(orderId);

    return order;
  }
}
