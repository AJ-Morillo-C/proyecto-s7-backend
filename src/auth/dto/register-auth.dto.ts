import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { IsEmailWhitelistedDomain } from 'src/common/validators/is-email-whitelisted-domain.validator';

export class RegisterAuthDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsEmailWhitelistedDomain()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
