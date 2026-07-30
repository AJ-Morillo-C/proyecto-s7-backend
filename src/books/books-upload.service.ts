import { Injectable, Logger, BadRequestException, HttpException } from "@nestjs/common";
import { PdfParserService } from "../pdf-parse/pdf-parser.service";
import { PdfRenderService } from "../pdf-parse/pdf-render.service";
import { AiMetadataService, BookMetadata } from "../ai-metadata/ai-metadata.service";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

@Injectable()
export class BooksUploadService {
  private readonly logger = new Logger(BooksUploadService.name);

  constructor(
    private readonly pdfParserService: PdfParserService,
    private readonly pdfRenderService: PdfRenderService,
    private readonly aiMetadataService: AiMetadataService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  private getErrorSummary(error: any) {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const payload = typeof response === "object" && response !== null ? response as any : null;

      return {
        status: error.getStatus(),
        code: payload?.error || "HTTP_EXCEPTION",
        message: payload?.message || error.message,
      };
    }

    return {
      code: error?.code || error?.name || "UNKNOWN_ERROR",
      message: error?.message || "Error desconocido",
    };
  }

  private formatErrorLog(event: string, error: any): string {
    const summary = this.getErrorSummary(error);
    return Object.entries({
      event,
      status: "status" in summary ? summary.status : undefined,
      code: summary.code,
      message: `"${summary.message}"`,
    })
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");
  }

  /**
   * Realiza únicamente la extracción de metadatos del PDF (estrategia híbrida) sin subir a Cloudinary.
   */
  async extractMetadata(file: Express.Multer.File): Promise<BookMetadata> {
    if (!file || !file.buffer) {
      throw new BadRequestException("El archivo PDF es requerido.");
    }

    try {
      this.logger.debug(`Extrayendo metadatos del archivo: ${file.originalname}`);

      // 1. Intentar extraer texto con PdfParserService
      const parserResult = await this.pdfParserService.parse(file.buffer);

      let metadata: BookMetadata;

      // 2. Evaluar si es PDF nativo o escaneado
      if (!parserResult.isScanned) {
        this.logger.debug("El archivo es un PDF nativo. Usando extracción por texto...");
        metadata = await this.aiMetadataService.extractFromText(parserResult.text);
      } else {
        this.logger.debug("El archivo es un PDF escaneado (o tiene poco texto). Iniciando extracción por imagen...");

        // Renderizar la página 1 a imagen PNG
        const imageBuffer = await this.pdfRenderService.renderFirstPageToPng(file.buffer);
        metadata = await this.aiMetadataService.extractFromImage(imageBuffer, "image/png");
      }

      return metadata;
    } catch (error) {
      const summary = this.getErrorSummary(error);
      const isHandledAiError =
        typeof summary.code === "string" && summary.code.startsWith("AI_");

      if (isHandledAiError) {
        throw error;
      }

      if (error instanceof HttpException && error.getStatus() < 500) {
        this.logger.warn(this.formatErrorLog("book_metadata_extraction_failed", error));
      } else {
        this.logger.error(this.formatErrorLog("book_metadata_extraction_failed", error));
      }

      throw error;
    }
  }

  /**
   * Recibe el archivo de Multer, realiza la extracción de metadatos usando la estrategia híbrida,
   * y sube el archivo original a Cloudinary.
   */
  async uploadAndExtract(file: Express.Multer.File): Promise<{ url: string; metadata: BookMetadata }> {
    if (!file || !file.buffer) {
      throw new BadRequestException("El archivo PDF es requerido.");
    }

    try {
      this.logger.debug(`Iniciando procesamiento completo del archivo: ${file.originalname}`);

      // 1. Extraer metadatos
      const metadata = await this.extractMetadata(file);

      // 2. Subir el archivo a Cloudinary
      this.logger.debug("Subiendo archivo a Cloudinary...");
      const uploadedFile = await this.cloudinaryService.uploadFile(file);
      this.logger.debug(`Archivo subido exitosamente. URL: ${uploadedFile.secure_url}`);

      // 3. Retornar la URL y los metadatos
      return {
        url: uploadedFile.secure_url,
        metadata,
      };
    } catch (error) {
      const summary = this.getErrorSummary(error);
      const isHandledAiError =
        typeof summary.code === "string" && summary.code.startsWith("AI_");

      if (isHandledAiError) {
        throw error;
      }

      if (error instanceof HttpException && error.getStatus() < 500) {
        this.logger.warn(this.formatErrorLog("book_upload_failed", error));
      } else {
        this.logger.error(this.formatErrorLog("book_upload_failed", error));
      }

      throw error;
    }
  }
}
