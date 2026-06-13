import { IsEnum, IsOptional, IsDate, IsString } from "class-validator";
import { Exclude } from "class-transformer";
import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import { UserRole } from "../../common/enums/user-role.enum"; 

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  resetToken?: string;

  @IsDate()
  @IsOptional()
  resetTokenExpiry?;

  @Exclude()
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: "role must be either USER or ADMIN" })
  role?: UserRole;
}
