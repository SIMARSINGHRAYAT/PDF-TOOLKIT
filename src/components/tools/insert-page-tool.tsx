"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PdfPagePreview } from "@/components/pdf-page-preview";
import { PdfUpload } from "@/components/pdf-upload";
import { appLimits, withSuffix } from "@/lib/file-utils";
import { getPdfPageCount } from "@/lib/pdf-render";
import { insertPdfPage } from "@/lib/pdf-tools";
import { savePdfResult } from "@/lib/result-store";

function toPdfBlob(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

type LoadedPdf = { file: File; data: ArrayBuffer; pageCount: number };

export function InsertPageTool() {
  const router = useRouter();
  const [destination, setDestination] = useState<LoadedPdf | null>(null);
  const [source, setSource] = useState<LoadedPdf | null>(null);
  const [sourcePage, setSourcePage] = useState(1);
  const [insertAfter, setInsertAfter] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  const loadPdf = async (file: File): Promise<LoadedPdf> => {
    const data = await file.arrayBuffer();
    const pageCount = await getPdfPageCount(data);
    if (Number.isFinite(appLimits.maxPagesPerDocument) && pageCount > appLimits.maxPagesPerDocument) {
      throw new Error(`This PDF exceeds the ${appLimits.maxPagesPerDocument}-page limit.`);
    }
    return { file, data, pageCount };
  };

  const selectDestination = async (file: File | null) => {
    setDestination(null);
    setResultId(null);
    setError(null);
    if (!file) return;
    try {
      const loaded = await loadPdf(file);
      setDestination(loaded);
      setInsertAfter(Math.min(1, loaded.pageCount));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to read the destination PDF.");
    }
  };

  const selectSource = async (file: File | null) => {
    setSource(null);
    setResultId(null);
    setError(null);
    if (!file) return;
    try {
      const loaded = await loadPdf(file);
      setSource(loaded);
      setSourcePage(1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to read the source PDF.");
    }
  };

  const insertPage = async () => {
    if (!destination || !source) {
      setError("Upload both a destination PDF and a source PDF first.");
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setResultId(null);
      const bytes = await insertPdfPage(destination.data, source.data, sourcePage, insertAfter);
      const id = savePdfResult({
        blob: toPdfBlob(bytes),
        defaultFilename: withSuffix(destination.file.name, "page-inserted", "pdf"),
        heading: "PDF Page Inserted",
        sourcePath: "/insert-page",
        successMessage: "The PDF page was inserted successfully.",
      });
      setResultId(id);
      router.push(`/result/${id}`);
    } catch {
      setError("We couldn't insert this PDF page. Check the selected page and position.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Insert a PDF Page</h1>
        <Link href="/dashboard" className="text-sm text-zinc-300 hover:text-white">← Back</Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <PdfUpload maxFiles={1} onSelect={(files) => void selectDestination(files[0] ?? null)} onClear={() => void selectDestination(null)} label="Upload the PDF to edit" />
          {destination ? <PdfPagePreview data={destination.data} pageCount={destination.pageCount} page={Math.min(insertAfter || 1, destination.pageCount)} onPageChange={(page) => setInsertAfter(page)} label={`${destination.file.name} destination preview`} /> : null}
        </div>
        <div className="space-y-3">
          <PdfUpload maxFiles={1} onSelect={(files) => void selectSource(files[0] ?? null)} onClear={() => void selectSource(null)} label="Upload the PDF page to insert" />
          {source ? <PdfPagePreview data={source.data} pageCount={source.pageCount} page={sourcePage} onPageChange={setSourcePage} label={`${source.file.name} source preview`} /> : null}
        </div>
      </div>

      {destination && source ? (
        <div className="space-y-4 rounded-2xl border border-white/20 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5">
          <label className="block text-sm text-zinc-300" htmlFor="insert-position">Insert the selected source page after destination page</label>
          <select id="insert-position" value={insertAfter} onChange={(event) => setInsertAfter(Number(event.target.value))} className="w-full px-3 py-2 text-base">
            <option value={0}>Before page 1</option>
            {Array.from({ length: destination.pageCount }, (_, index) => <option key={index + 1} value={index + 1}>After page {index + 1}{index + 1 === destination.pageCount ? " (at the end)" : ""}</option>)}
          </select>
          <button type="button" onClick={() => void insertPage()} disabled={processing} className="rounded-xl border border-zinc-400 bg-zinc-900 px-5 py-3 text-base font-semibold text-white disabled:opacity-50">
            {processing ? "Inserting page..." : `Insert source page ${sourcePage}`}
          </button>
          {resultId ? <button type="button" onClick={() => router.push(`/result/${resultId}`)} className="ml-3 px-4 py-2 text-sm">Download result</button> : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </section>
  );
}