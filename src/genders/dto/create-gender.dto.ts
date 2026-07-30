import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateGenderDto {
  @IsString()
  @IsNotEmpty()
  genderName: string;

  @IsString()
  @IsOptional()
  description?: string;
}
