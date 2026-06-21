import { Module } from "@nestjs/common";
import { BooksService } from "./books.service";
import { BooksController } from "./books.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookEntity } from "./entities/book.entity";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { PdfParserModule } from "../pdf-parse/pdf-parser.module";
import { PdfTestController } from "./pdf-test.controller";
import { AiMetadataModule } from "../ai-metadata/ai-metadata.module";
import { BooksUploadService } from "./books-upload.service";

@Module({
  controllers: [BooksController, PdfTestController],
  providers: [BooksService, BooksUploadService],
  imports: [
    TypeOrmModule.forFeature([BookEntity]),
    CloudinaryModule,
    PdfParserModule,
    AiMetadataModule,
  ],
  exports: [BooksService, BooksUploadService],
})
export class BooksModule {}
