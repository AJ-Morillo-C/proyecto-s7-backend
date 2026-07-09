import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';
import { IsEmailWhitelistedDomain } from '../../common/validators/is-email-whitelisted-domain.validator';

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
  @MinLength(8)
  password: string;
}
