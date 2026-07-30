import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI, Type } from "@google/genai";

export interface BookMetadata {
  title: string;
  isbn?: string;
  author?: string;
  editorial?: string;
  publicationDate?: number;
  gender?: string;
  synopsis?: string;
}

@Injectable()
export class AiMetadataService {
  private readonly logger = new Logger(AiMetadataService.name);
  private readonly ai: GoogleGenAI;
  private readonly modelName = "gemini-2.5-flash";

  // Definición del esquema JSON esperado de Gemini
  private readonly responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "El título del libro. Debe ser descriptivo y exacto.",
      },
      isbn: {
        type: Type.STRING,
        description:
          "El número ISBN de 10 o 13 dígitos. Retornar solo el número (sin guiones) o null si no se encuentra.",
      },
      author: {
        type: Type.STRING,
        description: "El nombre del autor o autores principales.",
      },
      editorial: {
        type: Type.STRING,
        description: "La editorial que publica el libro.",
      },
      publicationDate: {
        type: Type.INTEGER,
        description: "El año de publicación en formato YYYY (ej. 2021). De ser posible, deduce o encuentra el año.",
      },
      gender: {
        type: Type.STRING,
        description:
          "El género o categoría principal del libro (ej. Programación, Metodología de la Investigación, Matemáticas, Física, Electrónica, Base de Datos, Ficción, Ciencia, Historia, Tecnología, Autoayuda).",
      },
      synopsis: {
        type: Type.STRING,
        description:
          "Una breve sinopsis o resumen de los primeros capítulos o el tema general del libro (máximo 400 caracteres).",
      },
    },
    required: ["title"],
  };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!apiKey) {
      this.logger.error("GEMINI_API_KEY no está configurada en las variables de entorno (.env).");
    }
    // Inicializar el SDK oficial de Google Gen AI
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Helper que envuelve llamadas asíncronas con reintentos y retroceso exponencial (backoff)
   * para manejar errores temporales del servidor como el 503 (alta demanda) o 429 (límite de peticiones).
   */
  private async retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const status = this.getAiErrorStatus(error);
      const message = this.getAiErrorMessage(error);
      const isQuotaExhausted = this.isAiQuotaExhaustedError(error);

      const isTemporaryError =
        status === 503 ||
        (status === 429 && !isQuotaExhausted) ||
        message.includes("503") ||
        (message.includes("429") && !isQuotaExhausted) ||
        message.includes("high demand") ||
        message.includes("UNAVAILABLE");

      if (retries > 0 && isTemporaryError) {
        this.logger.warn(
          this.formatAiLog("ai_metadata_retry", error, {
            retryInMs: delayMs,
            remainingRetries: retries,
          })
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.retry(fn, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }

  private getAiErrorStatus(error: any): number | string | undefined {
    return (
      error?.status ||
      error?.code ||
      error?.response?.status ||
      error?.error?.code ||
      this.tryParseJson(error?.message)?.error?.code
    );
  }

  private getAiErrorMessage(error: any): string {
    const parsedMessage = this.tryParseJson(error?.message);
    const candidates = [
      parsedMessage?.error?.message,
      error?.message,
      error?.response?.data?.error?.message,
      error?.response?.data?.message,
      error?.error?.message,
      typeof error === "string" ? error : "",
    ];

    return candidates.find((value) => typeof value === "string" && value.trim()) || "";
  }

  private getAiErrorCode(error: any): string {
    const parsedMessage = this.tryParseJson(error?.message);
    const candidates = [
      parsedMessage?.error?.status,
      error?.response?.data?.error?.status,
      error?.error?.status,
      error?.code,
      error?.status,
    ];

    const value = candidates.find((candidate) => candidate !== undefined && candidate !== null);
    return String(value || "UNKNOWN");
  }

  private getAiRetryDelay(error: any): string | null {
    const parsedMessage = this.tryParseJson(error?.message);
    const details =
      parsedMessage?.error?.details ||
      error?.response?.data?.error?.details ||
      error?.error?.details;

    if (!Array.isArray(details)) {
      return null;
    }

    const retryInfo = details.find((detail) => detail?.retryDelay);
    return typeof retryInfo?.retryDelay === "string" ? retryInfo.retryDelay : null;
  }

  private getAiErrorSummary(error: any) {
    const message = this.getAiErrorMessage(error).replace(/\s+/g, " ").trim();
    const displayMessage = this.isAiQuotaExhaustedError(error)
      ? "Cuota del servicio de IA agotada."
      : this.isAiUnavailableError(error)
        ? "Servicio de IA temporalmente no disponible."
        : message
          ? this.truncateText(message, 180)
          : "Sin detalle";

    return {
      status: this.getAiErrorStatus(error) || "UNKNOWN",
      code: this.getAiErrorCode(error),
      message: displayMessage,
      retryDelay: this.getAiRetryDelay(error),
    };
  }

  private formatAiLog(
    event: string,
    error: any,
    extra: Record<string, string | number | null> = {}
  ): string {
    const summary = this.getAiErrorSummary(error);
    const parts = [
      `event=${event}`,
      `status=${summary.status}`,
      `code=${summary.code}`,
      `message="${summary.message}"`,
    ];

    if (summary.retryDelay) {
      parts.push(`retryDelay=${summary.retryDelay}`);
    }

    for (const [key, value] of Object.entries(extra)) {
      if (value !== null && value !== undefined) {
        parts.push(`${key}=${value}`);
      }
    }

    return parts.join(" ");
  }

  private tryParseJson(value: unknown): any | null {
    if (typeof value !== "string") {
      return null;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue.startsWith("{") && !trimmedValue.startsWith("[")) {
      return null;
    }

    try {
      return JSON.parse(trimmedValue);
    } catch {
      return null;
    }
  }

  private truncateText(value: string, maxLength: number): string {
    return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
  }

  private isAiQuotaExhaustedError(error: any): boolean {
    const code = this.getAiErrorCode(error).toLowerCase();
    const message = this.getAiErrorMessage(error).toLowerCase();

    return (
      code.includes("resource_exhausted") ||
      message.includes("quota exceeded") ||
      message.includes("exceeded your current quota")
    );
  }

  private isAiLimitError(error: any): boolean {
    const status = this.getAiErrorStatus(error);
    const message = this.getAiErrorMessage(error).toLowerCase();

    return (
      status === 429 ||
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("resource_exhausted") ||
      message.includes("rate limit") ||
      message.includes("too many requests") ||
      message.includes("exceeded your current quota")
    );
  }

  private isAiUnavailableError(error: any): boolean {
    const status = this.getAiErrorStatus(error);
    const message = this.getAiErrorMessage(error).toLowerCase();

    return (
      status === 503 ||
      message.includes("503") ||
      message.includes("unavailable") ||
      message.includes("high demand") ||
      message.includes("overloaded")
    );
  }

  private throwAiServiceError(error: any): never {
    if (this.isAiLimitError(error)) {
      throw new HttpException(
        {
          error: "AI_QUOTA_EXCEEDED",
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            "Limite de IA alcanzado. No quedan peticiones disponibles por ahora; intenta de nuevo mas tarde o revisa la cuota del servicio de IA.",
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    if (this.isAiUnavailableError(error)) {
      throw new HttpException(
        {
          error: "AI_TEMPORARILY_UNAVAILABLE",
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            "La IA esta temporalmente saturada o no disponible. Intenta de nuevo en unos minutos.",
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    throw error;
  }

  /**
   * Extrae los metadatos de un texto plano (PDF Nativo)
   */
  async extractFromText(text: string): Promise<BookMetadata> {
    try {
      this.logger.debug("Iniciando extracción de metadatos desde texto plano...");

      const prompt = `Analiza el siguiente extracto de texto de las primeras páginas de un libro. Extrae la información necesaria para rellenar los metadatos del libro. Si no encuentras algún dato específico, omítelo o devuélvelo como nulo, pero haz tu mejor esfuerzo por deducir el título, el autor, la editorial y el año de publicación si aparecen en la portada o páginas de créditos/derechos.
      
Texto extraído:
---
${text}
---`;

      const response = await this.retry(() =>
        this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: this.responseSchema,
            temperature: 0.1, // temperatura baja para mayor precisión factual
          },
        })
      );

      const responseText = response.text;
      if (!responseText) {
        throw new Error("La respuesta de IA está vacía");
      }

      this.logger.debug("Metadatos extraídos con éxito desde texto.");
      return JSON.parse(responseText) as BookMetadata;
    } catch (error) {
      if (this.isAiLimitError(error) || this.isAiUnavailableError(error)) {
        this.logger.warn(this.formatAiLog("ai_metadata_text_failed", error));
        this.throwAiServiceError(error);
      }
      this.logger.error(this.formatAiLog("ai_metadata_text_failed", error));
      return this.getDefaultMetadata();
    }
  }

  /**
   * Extrae los metadatos a partir de una imagen (PDF Escaneado)
   */
  async extractFromImage(imageBuffer: Buffer, mimeType = "image/png"): Promise<BookMetadata> {
    try {
      this.logger.debug(`Iniciando extracción de metadatos desde imagen de tipo ${mimeType}...`);

      const prompt = `Analiza esta imagen que corresponde a la primera página o portada de un libro escaneado. Identifica los metadatos del libro, tales como el título, autor, editorial, fecha de publicación aproximada (si está visible en la portada) y género. Genera una breve sinopsis visual basada en los elementos de la portada o título si no hay suficiente texto legible.`;

      const response = await this.retry(() =>
        this.ai.models.generateContent({
          model: this.modelName,
          contents: [
            prompt,
            {
              inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: mimeType,
              },
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: this.responseSchema,
            temperature: 0.2,
          },
        })
      );

      const responseText = response.text;
      if (!responseText) {
        throw new Error("La respuesta de IA está vacía para la imagen");
      }

      this.logger.debug("Metadatos extraídos con éxito desde imagen.");
      return JSON.parse(responseText) as BookMetadata;
    } catch (error) {
      if (this.isAiLimitError(error) || this.isAiUnavailableError(error)) {
        this.logger.warn(this.formatAiLog("ai_metadata_image_failed", error));
        this.throwAiServiceError(error);
      }
      this.logger.error(this.formatAiLog("ai_metadata_image_failed", error));
      return this.getDefaultMetadata();
    }
  }

  /**
   * Valores por defecto en caso de error en la IA
   */
  private getDefaultMetadata(): BookMetadata {
    return {
      title: "Libro sin título",
      synopsis: "No se pudo generar la sinopsis automáticamente.",
    };
  }
}
