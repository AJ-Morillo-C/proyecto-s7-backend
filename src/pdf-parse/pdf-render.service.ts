import { Injectable, Logger } from '@nestjs/common';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';

class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas: Canvas = createCanvas(Math.ceil(width), Math.ceil(height));
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    return { canvas, context };
  }

  reset(canvasAndContext: { canvas: Canvas; context: CanvasRenderingContext2D }) {
    const { canvas, context } = canvasAndContext;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  destroy(canvasAndContext: { canvas: Canvas; context: CanvasRenderingContext2D }) {
    const { canvas } = canvasAndContext;
    // node-canvas doesn't need explicit destroy, but clear refs
    // @ts-ignore
    canvas.width = 0;
    // @ts-ignore
    canvas.height = 0;
  }
}

@Injectable()
export class PdfRenderService {
  private readonly logger = new Logger(PdfRenderService.name);

  constructor() {
    try {
      (pdfjsLib as any).GlobalWorkerOptions = (pdfjsLib as any).GlobalWorkerOptions || {};
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = null;
    } catch (e) {
      // ignore
    }
  }

  /**
   * Renderiza la primera página del PDF a PNG Buffer.
   * scale: resolución multiplicadora (1..3). Por defecto 2 para buena legibilidad.
   */
  async renderFirstPageToPng(buffer: Buffer, scale = 2): Promise<Buffer> {
    let pdfDoc: any = null;
    try {
      pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      if (!pdfDoc || pdfDoc.numPages < 1) throw new Error('PDF has no pages');

      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale });

      const canvasFactory = new NodeCanvasFactory();
      const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);

      const renderContext = {
        canvasContext: context,
        viewport,
        canvasFactory,
      } as any;

      await page.render(renderContext).promise;

      const pngBuffer = (canvas as any).toBuffer('image/png');
      return pngBuffer;
    } catch (err) {
      this.logger.error('Error rendering PDF to PNG', err as any);
      throw err;
    } finally {
      if (pdfDoc && typeof pdfDoc.destroy === 'function') {
        try {
          await pdfDoc.destroy();
        } catch {}
      }
    }
  }
}
