import { CartItemEntity } from '../entities/cart-item.entity';
import { CartEntity } from '../entities/cart.entity';

export function calculateCartTotal(cart: CartEntity): number {
  return cart
    ? cart?.items?.reduce((acc: number, { price, count }: CartItemEntity) => {
        return (acc += price * count);
      }, 0)
    : 0;
}
