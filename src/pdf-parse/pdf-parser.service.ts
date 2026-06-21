import { Injectable, Logger } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';

export type PdfParseResult = {
  text: string;
  isScanned: boolean;
  pageCount: number;
};

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);
  private readonly MIN_TEXT_LENGTH = 150;
  private readonly PAGE_LIMIT = 5;

  async parse(buffer: Buffer): Promise<PdfParseResult> {
    let parser: PDFParse | null = null;
    try {
      // Inicializar el analizador con el buffer del PDF convertido a Uint8Array
      parser = new PDFParse({ data: new Uint8Array(buffer) });

      // Extraer el texto limitando a las primeras N páginas
      const data = await parser.getText({
        first: this.PAGE_LIMIT,
      });

      const rawText = data.text || '';
      
      // Limpiar texto: eliminar espacios duplicados y saltos de línea/tabulaciones innecesarias
      const text = rawText
        .replace(/\s+/g, ' ')
        .trim();

      const pageCount = data.total || 0;
      const isScanned = text.length < this.MIN_TEXT_LENGTH;

      this.logger.debug(`Parsed PDF: pages=${pageCount}, textLen=${text.length}, isScanned=${isScanned}`);

      return { text, isScanned, pageCount };
    } catch (error) {
      this.logger.error('Error parsing PDF with pdf-parse', error as any);
      // En caso de error, se retorna como escaneado para forzar el fallback de visión por IA
      return { text: '', isScanned: true, pageCount: 0 };
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch (destroyError) {
          this.logger.warn('Failed to destroy PDFParse instance', destroyError as any);
        }
      }
    }
  }
}