/**
 * PDF Generation Utilities
 * Using pdf-lib for PDF creation and manipulation
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface PDFTextOptions {
  text: string;
  fontSize?: number;
  x?: number;
  y?: number;
  color?: { r: number; g: number; b: number };
}

/**
 * Create a simple PDF document
 */
export async function createPDF(options: {
  title?: string;
  content: string[];
  author?: string;
  subject?: string;
}): Promise<Buffer> {
  const { title = "Document", content, author, subject } = options;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const fontSize = 12;
  const titleFontSize = 24;
  const margin = 50;

  let y = height - margin;

  // Add title
  if (title) {
    page.drawText(title, {
      x: margin,
      y,
      size: titleFontSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= titleFontSize + 20;
  }

  // Add content
  for (const line of content) {
    if (y < margin) {
      // Create new page if needed
      const newPage = pdfDoc.addPage();
      y = newPage.getHeight() - margin;
    }

    page.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth: width - 2 * margin,
    });

    y -= fontSize + 5;
  }

  // Set metadata
  if (title) pdfDoc.setTitle(title);
  if (author) pdfDoc.setAuthor(author);
  if (subject) pdfDoc.setSubject(subject);
  pdfDoc.setCreationDate(new Date());

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Merge multiple PDFs
 */
export async function mergePDFs(pdfBuffers: Buffer[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create();

  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  return Buffer.from(mergedPdfBytes);
}

/**
 * Extract pages from PDF
 */
export async function extractPDFPages(
  pdfBuffer: Buffer,
  pageNumbers: number[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();

  const pages = await newPdf.copyPages(pdfDoc, pageNumbers);
  pages.forEach((page) => newPdf.addPage(page));

  const pdfBytes = await newPdf.save();
  return Buffer.from(pdfBytes);
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(pdfBuffer: Buffer): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  return {
    pageCount: pdfDoc.getPageCount(),
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    creator: pdfDoc.getCreator(),
    producer: pdfDoc.getProducer(),
    creationDate: pdfDoc.getCreationDate(),
    modificationDate: pdfDoc.getModificationDate(),
  };
}

/**
 * Add watermark to PDF
 */
export async function addPDFWatermark(
  pdfBuffer: Buffer,
  watermarkText: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 2 - (watermarkText.length * 10) / 2,
      y: height / 2,
      size: 50,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.3,
      rotate: { angle: -45, type: "degrees" } as any,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
