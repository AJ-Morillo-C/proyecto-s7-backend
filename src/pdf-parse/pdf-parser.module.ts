import { Module } from '@nestjs/common';
import { PdfParserService } from './pdf-parser.service';
import { PdfRenderService } from './pdf-render.service';

@Module({
  providers: [PdfParserService, PdfRenderService],
  exports: [PdfParserService, PdfRenderService],
})
export class PdfParserModule {}