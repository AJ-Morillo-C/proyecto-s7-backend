import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateEditorialDto {
  @IsString()
  @IsNotEmpty()
  editorialName: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
