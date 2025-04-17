import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  title: string;

  @Column("text")
  description: string;

  @Column("decimal")
  price: number;

  @Column("text")
  imgurl: string;
}
