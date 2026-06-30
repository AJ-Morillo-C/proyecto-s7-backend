import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

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
  private readonly modelName = 'gemini-2.5-flash';

  // Definición del esquema JSON esperado de Gemini
  private readonly responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { 
        type: Type.STRING, 
        description: 'El título del libro. Debe ser descriptivo y exacto.' 
      },
      isbn: { 
        type: Type.STRING, 
        description: 'El número ISBN de 10 o 13 dígitos. Retornar solo el número (sin guiones) o null si no se encuentra.' 
      },
      author: { 
        type: Type.STRING, 
        description: 'El nombre del autor o autores principales.' 
      },
      editorial: { 
        type: Type.STRING, 
        description: 'La editorial que publica el libro.' 
      },
      publicationDate: { 
        type: Type.INTEGER, 
        description: 'El año de publicación en formato YYYY (ej. 2021). De ser posible, deduce o encuentra el año.' 
      },
      gender: { 
        type: Type.STRING, 
        description: 'El género o categoría principal del libro (ej. Programación, Metodología de la Investigación, Matemáticas, Física, Electrónica, Base de Datos, Ficción, Ciencia, Historia, Tecnología, Autoayuda).' 
      },
      synopsis: { 
        type: Type.STRING, 
        description: 'Una breve sinopsis o resumen de los primeros capítulos o el tema general del libro (máximo 400 caracteres).' 
      }
    },
    required: ['title'],
  };

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY no está configurada en las variables de entorno (.env).');
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
      const status = error?.status || error?.code;
      const message = error?.message || '';
      
      const isTemporaryError = 
        status === 503 || 
        status === 429 || 
        message.includes('503') || 
        message.includes('429') ||
        message.includes('high demand') ||
        message.includes('UNAVAILABLE');

      if (retries > 0 && isTemporaryError) {
        this.logger.warn(
          `La API de Gemini está experimentando alta demanda o límite excedido (${message}). Reintentando en ${delayMs}ms... (Intentos restantes: ${retries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.retry(fn, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }

  /**
   * Extrae los metadatos de un texto plano (PDF Nativo)
   */
  async extractFromText(text: string): Promise<BookMetadata> {
    try {
      this.logger.debug('Iniciando extracción de metadatos desde texto plano...');
      
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
            responseMimeType: 'application/json',
            responseSchema: this.responseSchema,
            temperature: 0.1, // temperatura baja para mayor precisión factual
          },
        })
      );

      const responseText = response.text;
      if (!responseText) {
        throw new Error('La respuesta de Gemini está vacía');
      }

      this.logger.debug('Metadatos extraídos con éxito desde texto.');
      return JSON.parse(responseText) as BookMetadata;
    } catch (error) {
      this.logger.error('Error al extraer metadatos del texto con Gemini', error as any);
      return this.getDefaultMetadata();
    }
  }

  /**
   * Extrae los metadatos a partir de una imagen (PDF Escaneado)
   */
  async extractFromImage(imageBuffer: Buffer, mimeType = 'image/png'): Promise<BookMetadata> {
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
                data: imageBuffer.toString('base64'),
                mimeType: mimeType,
              },
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: this.responseSchema,
            temperature: 0.2,
          },
        })
      );

      const responseText = response.text;
      if (!responseText) {
        throw new Error('La respuesta de Gemini está vacía para la imagen');
      }

      this.logger.debug('Metadatos extraídos con éxito desde imagen.');
      return JSON.parse(responseText) as BookMetadata;
    } catch (error) {
      this.logger.error('Error al extraer metadatos de la imagen con Gemini', error as any);
      return this.getDefaultMetadata();
    }
  }

  /**
   * Valores por defecto en caso de error en la IA
   */
  private getDefaultMetadata(): BookMetadata {
    return {
      title: 'Libro sin título',
      synopsis: 'No se pudo generar la sinopsis automáticamente.',
    };
  }
}
