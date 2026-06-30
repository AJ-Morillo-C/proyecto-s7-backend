import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class CreateBookDto {
  @IsString()
  @IsOptional()
  title?: string;

  @Transform(({ value }) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "string") {
      const cleaned = value.replace(/[- ]/g, "").trim();
      return cleaned === "" || cleaned === "0" ? null : cleaned;
    }
    if (value === 0) return null;
    return String(value);
  })
  @IsString()
  @IsOptional()
  isbn?: string | null;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  editorial?: string;

  @IsNumber()
  @IsOptional()
  publicationDate?: number;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  synopsis?: string;

  @IsString()
  @IsOptional()
  file: string;

  @IsNumber()
  @IsOptional()
  views?: number;

  @IsNumber()
  @IsOptional()
  downloads?: number;
}
