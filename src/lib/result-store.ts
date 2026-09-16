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
  void saveBrowserResult(result);
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

  const browserResult = await getBrowserResult(id);
  if (browserResult) {
    ensureStore()[id] = browserResult;
    return browserResult;
  }

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

const browserStoreName = "pdf-results";
const browserDatabaseName = "pdf-toolkit";

function openBrowserDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(browserDatabaseName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(browserStoreName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveBrowserResult(result: PdfResultRecord): Promise<void> {
  try {
    const database = await openBrowserDatabase();
    if (!database) return;
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(browserStoreName, "readwrite");
      transaction.objectStore(browserStoreName).put(result);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // In-memory storage remains the final fallback when IndexedDB is unavailable.
  }
}

async function getBrowserResult(id: string): Promise<PdfResultRecord | null> {
  try {
    const database = await openBrowserDatabase();
    if (!database) return null;
    const result = await new Promise<PdfResultRecord | null>((resolve, reject) => {
      const transaction = database.transaction(browserStoreName, "readonly");
      const request = transaction.objectStore(browserStoreName).get(id);
      request.onsuccess = () => resolve((request.result as PdfResultRecord | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return result;
  } catch {
    return null;
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
