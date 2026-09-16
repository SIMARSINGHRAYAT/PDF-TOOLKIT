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
  const result = { id, ...payload };
  store[id] = result;
  void publishPdfResult(result);
  return id;
}

export function getPdfResult(id: string): PdfResultRecord | null {
  const store = ensureStore();
  return store[id] ?? null;
}

export async function getPdfResultAsync(id: string): Promise<PdfResultRecord | null> {
  const local = getPdfResult(id);
  if (local) return local;

  try {
    const response = await fetch(`/api/results/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!response.ok) return null;
    const blob = await response.blob();
    const result: PdfResultRecord = {
      id,
      blob,
      defaultFilename: decodeHeader(response.headers.get("X-PDF-Default-Filename"), "document.pdf"),
      heading: decodeHeader(response.headers.get("X-PDF-Heading"), "PDF Ready"),
      sourcePath: decodeHeader(response.headers.get("X-PDF-Source-Path"), "/dashboard"),
      successMessage: decodeHeader(response.headers.get("X-PDF-Success-Message"), "Your PDF is ready."),
    };
    ensureStore()[id] = result;
    return result;
  } catch {
    return null;
  }
}

async function publishPdfResult(result: PdfResultRecord): Promise<void> {
  try {
    const formData = new FormData();
    formData.append("id", result.id);
    formData.append("file", result.blob, result.defaultFilename);
    formData.append("defaultFilename", result.defaultFilename);
    formData.append("heading", result.heading);
    formData.append("sourcePath", result.sourcePath);
    formData.append("successMessage", result.successMessage);
    await fetch("/api/results", { method: "POST", body: formData, keepalive: true });
  } catch {
    // Local browser storage remains the fallback when server storage is unavailable.
  }
}

function decodeHeader(value: string | null, fallback: string): string {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value);
  } catch {
    return fallback;
  }
}
