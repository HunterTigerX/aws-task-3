import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { BasicAuthGuard } from '../auth';
import { OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';
import { calculateCartTotal } from './models-rules';
import { CartService } from './services';
import { CartResponse, CartStatuses } from './models';
import {
  CreateOrderPayload,
  OrderStatus,
  PutCartPayload,
} from 'src/order/type';
import { OrderEntity } from 'src/order/entities/order.entity';
import { CartEntity } from './entities/cart.entity';
import { randomUUID } from 'node:crypto';

@Controller('api/api/profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService,
  ) {}

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(@Req() req: AppRequest): Promise<CartResponse> {
    const cart = await this.cartService.findOrCreateByUserId(
      getUserIdFromRequest(req),
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { cart, total: calculateCartTotal(cart) },
    };
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(
    @Req() req: AppRequest,
    @Body() body: PutCartPayload,
  ): Promise<CartResponse> {
    const cart = await this.cartService.updateByUserId(
      getUserIdFromRequest(req),
      body,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: {
        cart,
        total: calculateCartTotal(cart),
      },
    };
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearUserCart(@Req() req: AppRequest): Promise<void> {
    await this.cartService.removeByUserId(getUserIdFromRequest(req));
  }

  // @UseGuards(JwtAuthGuard)
  @UseGuards(BasicAuthGuard)
  @Put('order')
  async checkout(@Req() req: AppRequest, @Body() body: CreateOrderPayload) {
    const userId = getUserIdFromRequest(req);
    return await this.cartService.dataSource.transaction(
      async (transactionalEntityManager) => {
        const cart = await transactionalEntityManager
          .getRepository(CartEntity)
          .findOne({
            where: { user_id: userId, status: CartStatuses.OPEN },
            relations: ['items'],
          });

        if (!(cart && cart.items.length)) {
          throw new BadRequestException('Cart is empty');
        }

        const { id: cartId, items } = cart;

        const total = calculateCartTotal(cart);
        const order = await transactionalEntityManager
          .getRepository(OrderEntity)
          .save({
            id: randomUUID(),
            user_id: userId,
            cartId: cartId,
            payment: 'Unknown',
            delivery: {
              address: body.address.address,
              firstName: 'firstnam',
              lastName: 'asd',
              comment: '123',
            },
            comments: body.address.comment || 'Comment',

            address: body.address,
            items: items.map(({ product, count }) => ({
              productId: product.id,
              count,
            })),

            total,
          });

        await transactionalEntityManager
          .getRepository(CartEntity)
          .update({ id: cartId }, { status: OrderStatus.ORDERED });

        return { order };
      },
    );
  }

  @UseGuards(BasicAuthGuard)
  @Get('order')
  async getOrder(): Promise<OrderEntity[]> {
    return this.orderService.getAll();
  }
}
