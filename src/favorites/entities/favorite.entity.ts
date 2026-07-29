import { BaseEntity } from "./../../common/config/base.entity";
import { Entity, ManyToOne } from "typeorm";
import { BookEntity } from "./../../books/entities/book.entity";
import { UserEntity } from "./../../users/entities/user.entity";

@Entity({ name: "favorite" })
export class FavoriteEntity extends BaseEntity {
  @ManyToOne(() => BookEntity, (book) => book.favorites)
  book: BookEntity;

  @ManyToOne(() => UserEntity, (user) => user.favorites)
  user: UserEntity;
}
