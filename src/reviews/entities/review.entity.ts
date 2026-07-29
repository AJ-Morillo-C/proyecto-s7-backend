import { BaseEntity } from "./../../common/config/base.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BookEntity } from "./../../books/entities/book.entity";
import { UserEntity } from "./../../users/entities/user.entity";

@Entity({ name: "review" })
export class ReviewEntity extends BaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.reviews)
  user: UserEntity;

  @Column({ type: "uuid" }) // Define la columna userId
  userId: string;

  @ManyToOne(() => BookEntity, (book) => book.reviews)
  book: BookEntity;

  @Column({ type: "uuid" }) // Define la columna bookId
  bookId: string;

  @Column({ type: "int" })
  rating: number;

  @Column({ type: "text", nullable: true })
  comment: string;
}
