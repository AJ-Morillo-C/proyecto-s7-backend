import { BaseEntity } from "./../../common/config/base.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { AuthorEntity } from "./../../authors/entities/author.entity";
import { EditorialEntity } from "./../../editorials/entities/editorial.entity";
import { GenderEntity } from "./../../genders/entities/gender.entity";
import { ReviewEntity } from "./../../reviews/entities/review.entity";
import { FavoriteEntity } from "./../../favorites/entities/favorite.entity";

@Entity({ name: "book" })
export class BookEntity extends BaseEntity {
  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar", unique: true, nullable: true })
  isbn: string;

  @ManyToOne(() => AuthorEntity, (author) => author.books, { nullable: true })
  @JoinColumn({ name: "author" })
  author?: AuthorEntity;

  @ManyToOne(() => EditorialEntity, (editorial) => editorial.books, { nullable: true })
  @JoinColumn({ name: "editorial" })
  editorial?: EditorialEntity;

  @Column({ type: "numeric", nullable: true })
  publicationDate?: number;

  @ManyToOne(() => GenderEntity, (gender) => gender.books, { nullable: true })
  @JoinColumn({ name: "gender" })
  gender?: GenderEntity;

  @Column({ type: "text", nullable: true })
  synopsis?: string;

  @Column({ type: "varchar" })
  file: string;

  @Column({ type: "numeric", default: 0 })
  views: number;

  @Column({ type: "numeric", default: 0 })
  downloads: number;

  @Column({ type: "numeric", default: 0, precision: 3, scale: 2 })
  averageRating: number;

  @OneToMany(() => ReviewEntity, (review) => review.book)
  reviews: ReviewEntity[];

  @OneToMany(() => FavoriteEntity, (favorite) => favorite.book)
  favorites: FavoriteEntity[];
}
