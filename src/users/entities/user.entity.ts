import { ReviewEntity } from "./../../reviews/entities/review.entity";
import { BaseEntity } from "./../../common/config/base.entity";
import { UserRole } from "./../../common/enums/user-role.enum";
import { Column, Entity, OneToMany } from "typeorm";
import { FavoriteEntity } from "./../../favorites/entities/favorite.entity";

@Entity({ name: "user" })
export class UserEntity extends BaseEntity {
  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", unique: true })
  email: string;

  @Column({ type: "varchar" })
  password: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @OneToMany(() => ReviewEntity, (review) => review.user)
  reviews: ReviewEntity[];

  @OneToMany(() => FavoriteEntity, (favorite) => favorite.user)
  favorites: FavoriteEntity[];

  @Column({ nullable: true })
  resetToken?: string;

  @Column({ nullable: true })
  resetTokenExpiry?: Date;

  @Column({ default: 0 })
  resetPasswordAttempts: number;

  @Column({ nullable: true, type: "timestamp" })
  lastResetPasswordAttempt?: Date;

  @Column({ nullable: true })
  profilePhoto: string;
}
