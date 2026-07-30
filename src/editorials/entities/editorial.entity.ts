import { BaseEntity } from "./../../common/config/base.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { BookEntity } from "./../../books/entities/book.entity";

@Entity({ name: "editorial" })
export class EditorialEntity extends BaseEntity {
  @Column({ type: "varchar" })
  editorialName: string;

  @Column({ type: "varchar" })
  address: string;

  @Column({ type: "varchar" })
  phone: string;

  @OneToMany(() => BookEntity, (book) => book.editorial)
  books: BookEntity[];
}
