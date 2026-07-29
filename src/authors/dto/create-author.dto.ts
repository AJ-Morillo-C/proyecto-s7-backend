import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAuthorDto {
  @IsString()
  @IsNotEmpty()
  authorName: string;

  @IsString()
  @IsOptional()
  biography?: string;

  @IsString()
  @IsOptional()
  photo?: string;
}
