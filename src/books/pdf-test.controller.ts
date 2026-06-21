import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PdfParserService } from '../pdf-parse/pdf-parser.service';

@Controller('books')
export class PdfTestController {
  constructor(private readonly pdfParserService: PdfParserService) {}

  @Post('test-parse')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async testParse(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer) throw new BadRequestException('file required');
    return this.pdfParserService.parse(file.buffer);
  }
}