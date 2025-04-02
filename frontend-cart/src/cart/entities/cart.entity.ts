// entities/cart.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CartItemEntity } from './cart-item.entity';

@Entity('carts')
export class CartEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  created_at: Date = new Date();

  @Column()
  updated_at: Date = new Date();

  @Column()
  status: string;

  @OneToMany(() => CartItemEntity, (item) => item.cart)
  items: CartItemEntity[];
}
