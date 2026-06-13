import { IsNotEmpty, IsOptional, IsString, IsStrongPassword } from "class-validator";
import { IsEmailWhitelistedDomain } from "../../common/validators/is-email-whitelisted-domain.validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmailWhitelistedDomain()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;
}
