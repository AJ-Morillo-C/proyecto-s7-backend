import { BaseEntity } from "./../../common/config/base.entity";
import { Column, Entity, OneToMany } from "typeorm";
import { BookEntity } from "./../../books/entities/book.entity";

@Entity({ name: "gender" })
export class GenderEntity extends BaseEntity {
  @Column({ type: "varchar" })
  genderName: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @OneToMany(() => BookEntity, (book) => book.gender)
  books: BookEntity[];
}
