function configuredLimit(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Infinity;
}

export const appLimits = {
  maxFilesPerOperation: configuredLimit(process.env.NEXT_PUBLIC_MAX_FILES_PER_OPERATION),
  maxPagesPerDocument: configuredLimit(process.env.NEXT_PUBLIC_MAX_PAGES_PER_DOCUMENT),
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[idx]}`;
}

export function baseName(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx > 0 ? filename.slice(0, idx) : filename;
}

export function ensurePdfExtension(name: string): string {
  return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
}

export function normalizePdfFilename(name: string, fallback = "document.pdf"): string {
  const trimmed = name.trim();
  const base = ensurePdfExtension(trimmed || fallback);
  const sanitized = base.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/\s+/g, " ").trim();
  return sanitized || fallback;
}

export function withSuffix(filename: string, suffix: string, ext?: string): string {
  const bn = baseName(filename);
  const resolvedExt = ext ?? filename.split(".").pop() ?? "pdf";
  return `${bn}-${suffix}.${resolvedExt.replace(/^\./, "")}`;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function saveBlob(blob: Blob, filename: string): Promise<void> {
  const picker = (window as Window & {
    showSaveFilePicker?: (options?: { suggestedName?: string; types?: Array<{ accept: Record<string, string[]> }> }) => Promise<{
      createWritable: () => Promise<{ write: (value: Blob) => Promise<void>; close: () => Promise<void> }>;
    }>;
  }).showSaveFilePicker;

  if (!picker) {
    triggerDownload(blob, filename);
    return;
  }

  try {
    const handle = await picker({
      suggestedName: filename,
      types: [{ accept: { "application/pdf": [".pdf"] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    if ((error as DOMException).name !== "AbortError") throw error;
  }
}

export function parsePageRange(input: string, maxPage: number): number[] {
  if (!input.trim()) return [];
  const pages = new Set<number>();

  for (const token of input.split(",").map((part) => part.trim())) {
    if (!token) continue;
    if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page >= 1 && page <= maxPage) pages.add(page);
      continue;
    }

    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let start = Number(rangeMatch[1]);
      let end = Number(rangeMatch[2]);
      if (start > end) [start, end] = [end, start];
      for (let p = start; p <= end; p += 1) {
        if (p >= 1 && p <= maxPage) pages.add(p);
      }
    }
  }

  return [...pages].sort((a, b) => a - b);
}

export function groupConsecutivePages(sortedPages: number[]): number[][] {
  if (sortedPages.length === 0) return [];
  const groups: number[][] = [];
  let current = [sortedPages[0]];
  for (let i = 1; i < sortedPages.length; i += 1) {
    const value = sortedPages[i];
    if (value === current[current.length - 1] + 1) {
      current.push(value);
    } else {
      groups.push(current);
      current = [value];
    }
  }
  groups.push(current);
  return groups;
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}
