import { Module } from "@nestjs/common";
import { AuthorsService } from "./authors.service";
import { AuthorsController } from "./authors.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthorEntity } from "./entities/author.entity";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { BooksModule } from "../books/books.module";

@Module({
  controllers: [AuthorsController],
  providers: [AuthorsService],
  imports: [TypeOrmModule.forFeature([AuthorEntity]), CloudinaryModule, BooksModule],
})
export class AuthorsModule {}
