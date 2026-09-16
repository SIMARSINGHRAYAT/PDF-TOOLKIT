"use client";

import { useState } from "react";
import Link from "next/link";
import { PdfUpload } from "@/components/pdf-upload";
import { PdfPagePreview } from "@/components/pdf-page-preview";
import { getPdfPageCount } from "@/lib/pdf-render";
import JSZip from "jszip";
import { splitPdf } from "@/lib/pdf-tools";
import { formatBytes, saveBlob, triggerDownload, withSuffix } from "@/lib/file-utils";

function toPdfBlob(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

function buildRangesFromSplitAfter(input: string, totalPages: number): string {
  const points = input
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isInteger(x) && x >= 1 && x < totalPages)
    .sort((a, b) => a - b);

  const unique = [...new Set(points)];
  const ranges: string[] = [];
  let start = 1;

  for (const point of unique) {
    ranges.push(`${start}-${point}`);
    start = point + 1;
  }

  if (start <= totalPages) {
    ranges.push(`${start}-${totalPages}`);
  }

  return ranges.join(", ");
}

async function downloadAllSplitResults(
  originalName: string,
  results: Array<{ filename: string; bytes: Uint8Array }>,
) {
  const zip = new JSZip();
  for (const result of results) {
    zip.file(result.filename, result.bytes);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, withSuffix(originalName, "split-files", "zip"));
}

export function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"ranges" | "after" | "every">("ranges");
  const [ranges, setRanges] = useState("1-3, 4-7");
  const [splitAfter, setSplitAfter] = useState("3, 7");
  const [pageCount, setPageCount] = useState(0);
  const [previewData, setPreviewData] = useState<ArrayBuffer | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [results, setResults] = useState<Array<{ filename: string; bytes: Uint8Array }>>([]);
  const [selectedResult, setSelectedResult] = useState(0);
  const [resultPageCount, setResultPageCount] = useState(0);
  const [resultPage, setResultPage] = useState(1);

  const onFile = async (selected: File | null) => {
    setFile(selected);
    setResults([]);
    setSelectedResult(0);
    setResultPageCount(0);
    setError(null);
    setPreviewData(null);
    setPreviewPage(1);
    if (!selected) return;

    try {
      const buffer = await selected.arrayBuffer();
      setPreviewData(buffer);
      setPageCount(1);
      const total = await getPdfPageCount(buffer);
      setPageCount(total);
    } catch {
      setPreviewData(null);
      setError("Unable to read this PDF. The file may be corrupted.");
    }
  };

  const onSplit = async () => {
    if (!file) {
      setError("Please upload a PDF first.");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const input =
        mode === "ranges"
          ? ranges
          : mode === "after"
            ? buildRangesFromSplitAfter(splitAfter, pageCount)
            : "";

      const output = await splitPdf(await file.arrayBuffer(), mode === "every" ? "every" : "ranges", input);
      setResults(output);
      setSelectedResult(0);
      setResultPage(1);
      setResultPageCount(await getPdfPageCount(output[0].bytes.buffer as ArrayBuffer));
    } catch {
      setError("Invalid split configuration or unsupported PDF content.");
      setResults([]);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Split PDF</h1>
        <Link href="/dashboard" className="text-sm text-zinc-300 hover:text-white">← Back</Link>
      </div>

      <PdfUpload onSelect={(incoming) => void onFile(incoming[0] ?? null)} onClear={() => void onFile(null)} label="Upload a PDF to split" />

      {file ? (
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap gap-5 text-base text-zinc-200">
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={mode === "ranges"} onChange={() => setMode("ranges")} />
              Split by ranges
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={mode === "after"} onChange={() => setMode("after")} />
              Split after pages
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={mode === "every"} onChange={() => setMode("every")} />
              Split every page
            </label>
          </div>

          {mode === "ranges" ? (
            <>
              <p className="text-base text-zinc-300">Define page ranges separated by commas</p>
              <input
                value={ranges}
                onChange={(event) => setRanges(event.target.value)}
                className="mt-2 w-full px-3 py-2 text-base"
                placeholder="1-3, 4-7, 8-10"
              />
            </>
          ) : mode === "after" ? (
            <>
              <p className="text-base text-zinc-300">Enter pages after which a new file should start</p>
              <input
                value={splitAfter}
                onChange={(event) => setSplitAfter(event.target.value)}
                className="mt-2 w-full px-3 py-2 text-base"
                placeholder="3, 7"
              />
              <p className="mt-2 text-sm text-zinc-500">Example with 10 pages: 3,7 ⇒ 1-3 · 4-7 · 8-10</p>
            </>
          ) : (
            <p className="text-base text-zinc-300">Each page will be exported into its own PDF file.</p>
          )}

          <button
            type="button"
            onClick={onSplit}
            disabled={processing}
            className="mt-4 rounded-xl border border-zinc-400 bg-zinc-900 px-5 py-3 text-base font-semibold text-white disabled:opacity-50"
          >
            {processing ? "Splitting PDF..." : "Split PDF"}
          </button>
        </div>
      ) : null}

      {previewData ? <PdfPagePreview data={previewData} pageCount={pageCount} page={previewPage} onPageChange={setPreviewPage} label="Source PDF preview" /> : null}

      {results.length > 0 ? (
        <div className="space-y-4 rounded-2xl border border-white/20 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5">
          <PdfPagePreview
            data={results[selectedResult].bytes.buffer as ArrayBuffer}
            pageCount={resultPageCount}
            page={resultPage}
            onPageChange={setResultPage}
            label={`Split output preview: ${results[selectedResult].filename}`}
          />
          <div className="flex items-center justify-between">
            <p className="text-base text-zinc-200">Split Output Files</p>
            <button
              type="button"
              onClick={() => void downloadAllSplitResults(file?.name ?? "document.pdf", results)}
              className="px-3 py-2 text-sm"
            >
              Download All (.zip)
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {results.map((result, idx) => (
              <li key={`${result.filename}-${idx}`} className="flex items-center justify-between rounded-lg border border-zinc-700 p-2">
                <div>
                  <span className="text-sm text-zinc-300">{result.filename}</span>
                  <p className="text-xs text-zinc-500">{formatBytes(result.bytes.byteLength)}</p>
                </div>
                <button type="button" onClick={() => { setSelectedResult(idx); setResultPage(1); void getPdfPageCount(result.bytes.buffer as ArrayBuffer).then(setResultPageCount); }} className="px-3 py-2 text-sm">
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => void saveBlob(toPdfBlob(result.bytes), result.filename)}
                  className="px-3 py-2 text-sm"
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </section>
  );
}
