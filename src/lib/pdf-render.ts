"use client";

import { PDFDocument } from "pdf-lib";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

const documentCache = new WeakMap<ArrayBuffer, Promise<any>>();

export async function loadPdfDocument(data: ArrayBuffer) {
  const cached = documentCache.get(data);
  if (cached) return await cached;
  const promise = loadPdfDocumentUncached(data);
  documentCache.set(data, promise);
  return await promise;
}

async function loadPdfDocumentUncached(data: ArrayBuffer) {
  try {
    const task = getDocument({ data: new Uint8Array(data) });
    return await task.promise;
  } catch {
    const fallback = getDocument({ data: new Uint8Array(data), disableWorker: true } as any);
    return await fallback.promise;
  }
}

export async function renderPdfPageToDataUrl(
  data: ArrayBuffer,
  pageNumber: number,
  width = 180,
): Promise<string> {
  const pdf = await loadPdfDocument(data);
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const scale = width / viewport.width;
  const scaled = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create canvas context");

  canvas.width = Math.floor(scaled.width);
  canvas.height = Math.floor(scaled.height);

  await page.render({ canvasContext: ctx, canvas, viewport: scaled }).promise;
  return canvas.toDataURL("image/png");
}

export async function renderAllPagesToImages(
  data: ArrayBuffer,
  opts: { dpi: number; format: "png" | "jpg"; quality?: number; pages?: number[] },
): Promise<Array<{ page: number; blob: Blob }>> {
  const pdf = await loadPdfDocument(data);
  const pageCount = pdf.numPages;
  const selected = opts.pages && opts.pages.length > 0 ? opts.pages : Array.from({ length: pageCount }, (_, i) => i + 1);
  const scale = opts.dpi / 72;

  const results: Array<{ page: number; blob: Blob }> = [];

  for (const pageNo of selected) {
    const page = await pdf.getPage(pageNo);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to create canvas context");

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, canvas, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => {
          if (!value) return reject(new Error("Failed to render image"));
          resolve(value);
        },
        opts.format === "png" ? "image/png" : "image/jpeg",
        opts.quality,
      );
    });

    results.push({ page: pageNo, blob });
  }

  return results;
}

export async function renderPdfPageForEditor(
  data: ArrayBuffer,
  pageNumber: number,
  targetWidth = 800,
): Promise<{ dataUrl: string; pageWidth: number; pageHeight: number; renderWidth: number; renderHeight: number }> {
  const pdf = await loadPdfDocument(data);
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const scale = targetWidth / base.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create canvas context");

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({ canvasContext: ctx, canvas, viewport }).promise;

  return {
    dataUrl: canvas.toDataURL("image/png"),
    pageWidth: base.width,
    pageHeight: base.height,
    renderWidth: canvas.width,
    renderHeight: canvas.height,
  };
}

export async function getPdfPageCount(data: ArrayBuffer): Promise<number> {
  const pdf = await PDFDocument.load(data);
  return pdf.getPageCount();
}
