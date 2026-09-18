import { PDFDocument } from "pdf-lib";
import { parsePageRange } from "@/lib/file-utils";

export type SplitMode = "every" | "ranges" | "selected";

export async function mergePdfs(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  for (const buffer of buffers) {
    const source = await PDFDocument.load(buffer);
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  return await merged.save();
}

export async function insertPdfPage(
  destinationBuffer: ArrayBuffer,
  sourceBuffer: ArrayBuffer,
  sourcePageNumber: number,
  insertAfterPage: number,
): Promise<Uint8Array> {
  const destination = await PDFDocument.load(destinationBuffer, { ignoreEncryption: true });
  const source = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
  const destinationPageCount = destination.getPageCount();
  const sourcePageCount = source.getPageCount();

  if (sourcePageNumber < 1 || sourcePageNumber > sourcePageCount) {
    throw new Error("The source page is outside the available page range.");
  }
  if (insertAfterPage < 0 || insertAfterPage > destinationPageCount) {
    throw new Error("The insertion position is outside the destination page range.");
  }

  const safeSourcePage = Math.floor(sourcePageNumber);
  const safeInsertAfter = Math.floor(insertAfterPage);
  if (safeSourcePage < 1 || safeSourcePage > sourcePageCount) {
    throw new Error("The source page is outside the available page range.");
  }
  if (safeInsertAfter < 0 || safeInsertAfter > destinationPageCount) {
    throw new Error("The insertion position is outside the destination page range.");
  }

  const output = await PDFDocument.create();
  const destinationPages = await output.copyPages(destination, destination.getPageIndices());
  const [sourcePage] = await output.copyPages(source, [safeSourcePage - 1]);

  if (safeInsertAfter === 0) output.addPage(sourcePage);
  destinationPages.forEach((page, index) => {
    output.addPage(page);
    if (index + 1 === safeInsertAfter) output.addPage(sourcePage);
  });

  return await output.save();
}

export async function splitPdf(
  buffer: ArrayBuffer,
  mode: SplitMode,
  pageInput: string,
): Promise<Array<{ filename: string; bytes: Uint8Array }>> {
  const source = await PDFDocument.load(buffer);
  const pageCount = source.getPageCount();

  if (mode === "every") {
    const output: Array<{ filename: string; bytes: Uint8Array }> = [];
    for (let i = 0; i < pageCount; i += 1) {
      const doc = await PDFDocument.create();
      const [page] = await doc.copyPages(source, [i]);
      doc.addPage(page);
      output.push({ filename: `page-${i + 1}.pdf`, bytes: await doc.save() });
    }
    return output;
  }

  if (mode === "selected") {
    const selected = parsePageRange(pageInput, pageCount);
    if (selected.length === 0) throw new Error("No valid selected pages.");
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(
      source,
      selected.map((p) => p - 1),
    );
    pages.forEach((page) => doc.addPage(page));
    return [{ filename: "selected-pages.pdf", bytes: await doc.save() }];
  }

  const tokens = pageInput
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const output: Array<{ filename: string; bytes: Uint8Array }> = [];

  for (const token of tokens) {
    const pagesForToken = parsePageRange(token, pageCount);
    if (pagesForToken.length === 0) continue;

    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(
      source,
      pagesForToken.map((p) => p - 1),
    );
    pages.forEach((page) => doc.addPage(page));

    const name =
      pagesForToken.length === 1
        ? `${pagesForToken[0]}`
        : `${pagesForToken[0]}-${pagesForToken[pagesForToken.length - 1]}`;

    output.push({ filename: `pages-${name}.pdf`, bytes: await doc.save() });
  }

  if (output.length === 0) throw new Error("No valid ranges selected.");
  return output;
}

export async function cropPdf(
  buffer: ArrayBuffer,
  crop: { x: number; y: number; width: number; height: number },
  pages: number[],
): Promise<Uint8Array> {
  const source = await PDFDocument.load(buffer);
  const targets = pages.length > 0 ? pages : [1];
  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(
    source,
    targets
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= source.getPageCount())
      .map((pageNumber) => pageNumber - 1),
  );

  for (const page of copiedPages) {
    page.setMediaBox(crop.x, crop.y, crop.width, crop.height);
    page.setCropBox(crop.x, crop.y, crop.width, crop.height);
    output.addPage(page);
  }

  if (copiedPages.length === 0) throw new Error("No valid crop page selected.");
  return await output.save();
}
