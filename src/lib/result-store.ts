export type PdfResultRecord = {
  id: string;
  blob: Blob;
  defaultFilename: string;
  heading: string;
  sourcePath: string;
  successMessage: string;
};

declare global {
  interface Window {
    __pdfToolkitResults?: Record<string, PdfResultRecord>;
  }
}

function ensureStore(): Record<string, PdfResultRecord> {
  if (typeof window === "undefined") {
    return {};
  }
  if (!window.__pdfToolkitResults) {
    window.__pdfToolkitResults = {};
  }
  return window.__pdfToolkitResults;
}

export function savePdfResult(payload: Omit<PdfResultRecord, "id">): string {
  const id = crypto.randomUUID();
  const store = ensureStore();
  store[id] = { id, ...payload };
  return id;
}

export function getPdfResult(id: string): PdfResultRecord | null {
  const store = ensureStore();
  return store[id] ?? null;
}
