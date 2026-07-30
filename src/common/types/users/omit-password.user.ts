import { UserEntity } from "./../../../users/entities/user.entity";
import { UserRole } from "../../enums/user-role.enum";

export type OmitPassword = Omit<UserEntity, "password" | "hashPassword" | "validatePassword"> & {
  role: UserRole;
};
