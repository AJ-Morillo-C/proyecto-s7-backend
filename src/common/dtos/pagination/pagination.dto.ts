import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginationDto {
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @IsNumber()
  @IsOptional()
  limit: number = 10;

  @IsOptional()
  @IsString()
  q?: string;
}
