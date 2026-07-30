import { BaseEntity } from "./../../common/config/base.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { BookEntity } from "./../../books/entities/book.entity";

@Entity({ name: "author" })
export class AuthorEntity extends BaseEntity {
  @Column({ type: "varchar" })
  authorName: string;

  @Column({ type: "text" })
  biography: string;

  @OneToMany(() => BookEntity, (book) => book.author)
  books: BookEntity[];

  @Column({ nullable: true })
  photo: string;
}
