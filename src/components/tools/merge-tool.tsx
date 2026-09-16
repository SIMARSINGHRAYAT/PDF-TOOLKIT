"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PdfUpload } from "@/components/pdf-upload";
import { PdfPagePreview } from "@/components/pdf-page-preview";
import { appLimits, formatBytes, withSuffix } from "@/lib/file-utils";
import { getPdfPageCount } from "@/lib/pdf-render";
import { mergePdfs } from "@/lib/pdf-tools";
import { savePdfResult } from "@/lib/result-store";

type MergeItem = {
  id: string;
  file: File;
  previewData: ArrayBuffer | null;
  previewPage: number;
  pageCount: number | null;
  status: "loading" | "ready" | "invalid";
};

function toPdfBlob(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

export function MergeTool() {
  const router = useRouter();
  const mergeFileLimit = Math.max(2, appLimits.maxFilesPerOperation);
  const [items, setItems] = useState<MergeItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const clearResultState = () => {
    setDone(null);
    setResultId(null);
    setError(null);
  };

  const addFiles = async (incoming: File[]) => {
    clearResultState();
    const availableSlots = mergeFileLimit - items.length;
    if (incoming.length > availableSlots) {
      setError(`You can merge up to ${mergeFileLimit} PDF files per operation.`);
      return;
    }

    const incomingItems: MergeItem[] = incoming.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewData: null,
      previewPage: 1,
      pageCount: null,
      status: "loading",
    }));

    setItems((prev) => [...prev, ...incomingItems]);

    await Promise.all(incomingItems.map(async (entry) => {
      try {
        const buffer = await entry.file.arrayBuffer();
        const pages = await getPdfPageCount(buffer);

        if (pages > appLimits.maxPagesPerDocument) {
          throw new Error(`This PDF exceeds the ${appLimits.maxPagesPerDocument}-page limit.`);
        }

        setItems((prev) =>
          prev.map((item) => (item.id === entry.id ? { ...item, pageCount: pages, previewData: buffer, status: "ready" } : item)),
        );

      } catch {
        setItems((prev) => prev.map((item) => (item.id === entry.id ? { ...item, status: "invalid" } : item)));
      }
    }));
  };

  const moveById = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    clearResultState();
    setItems((prev) => {
      const from = prev.findIndex((x) => x.id === sourceId);
      const to = prev.findIndex((x) => x.id === targetId);
      if (from < 0 || to < 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const onMerge = async () => {
    const valid = items.filter((item) => item.status === "ready");

    if (valid.length < 2) {
      setError("Please upload at least two valid PDF files.");
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setDone(null);
      setResultId(null);

      const output = await mergePdfs(await Promise.all(valid.map((item) => item.file.arrayBuffer())));
      const blob = toPdfBlob(output);
      const id = savePdfResult({
        blob,
        defaultFilename: withSuffix(valid[0].file.name, "merged", "pdf"),
        heading: "Merged PDF Ready",
        sourcePath: "/merge-pdf",
        successMessage: "PDF files merged successfully",
      });

      setResultId(id);
      setDone("PDF files merged successfully");
      router.push(`/result/${id}`);
    } catch {
      setError("We couldn't merge these PDF files. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const readyCount = items.filter((x) => x.status === "ready").length;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Merge Multiple PDFs</h1>
        <Link href="/dashboard" className="text-sm text-zinc-300 hover:text-white">← Back</Link>
      </div>

      <PdfUpload multiple maxFiles={mergeFileLimit} onSelect={(incoming) => void addFiles(incoming)} label="Upload PDF files to merge" />

      <div className="space-y-3">
        {items.map((item, idx) => (
          <article
            key={item.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggingId) moveById(draggingId, item.id);
              setDraggingId(null);
            }}
            className={`rounded-2xl border border-white/20 bg-white/[0.04] p-4 backdrop-blur-sm transition ${draggingId === item.id ? "border-zinc-300 bg-white/[0.1]" : ""}`}
          >
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <span>PDF {idx + 1}</span>
              <button
                type="button"
                draggable
                onDragStart={() => setDraggingId(item.id)}
                onDragEnd={() => setDraggingId(null)}
                className="cursor-grab rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 active:cursor-grabbing"
                aria-label={`Drag to reorder ${item.file.name}`}
              >
                Drag
              </button>
            </div>
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_1fr_auto]">
              {item.status === "ready" && item.previewData ? (
                <PdfPagePreview
                  data={item.previewData}
                  pageCount={item.pageCount ?? 1}
                  page={item.previewPage}
                  onPageChange={(page) => setItems((prev) => prev.map((current) => current.id === item.id ? { ...current, previewPage: page } : current))}
                  label={`${item.file.name} preview`}
                />
              ) : (
                <div className="rounded-2xl border border-white/20 bg-white/[0.04] p-6 text-sm text-zinc-400">{item.status === "loading" ? "Reading PDF..." : "Preview unavailable"}</div>
              )}

              <div>
                <p className="text-base font-medium text-white break-all">{item.file.name}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {item.pageCount
                    ? `${item.pageCount} pages`
                    : item.status === "invalid"
                      ? "Invalid PDF"
                      : "Reading pages..."} • {formatBytes(item.file.size)}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = items.findIndex((x) => x.id === item.id);
                    if (currentIndex > 0) {
                      moveById(item.id, items[currentIndex - 1].id);
                    }
                  }}
                  className="px-3 py-1.5 text-xs"
                  aria-label={`Move ${item.file.name} up`}
                >
                  Move Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = items.findIndex((x) => x.id === item.id);
                    if (currentIndex >= 0 && currentIndex < items.length - 1) {
                      moveById(item.id, items[currentIndex + 1].id);
                    }
                  }}
                  className="px-3 py-1.5 text-xs"
                  aria-label={`Move ${item.file.name} down`}
                >
                  Move Down
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearResultState();
                    setItems((prev) => prev.filter((x) => x.id !== item.id));
                  }}
                  className="px-3 py-1.5 text-xs text-red-300 hover:text-red-200"
                  aria-label={`Remove ${item.file.name}`}
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onMerge}
          disabled={processing || readyCount < 2}
          className="rounded-xl border border-zinc-400 bg-zinc-900 px-6 py-3 text-base font-semibold text-white disabled:opacity-50"
        >
          {processing ? "Merging PDFs..." : "Merge PDFs"}
        </button>

        {resultId ? (
          <button
            type="button"
            onClick={() => router.push(`/result/${resultId}`)}
            className="rounded-xl border border-zinc-500 bg-zinc-950 px-6 py-3 text-base font-semibold text-white hover:bg-zinc-900"
          >
            Download Merged PDF
          </button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {done ? <p className="text-sm text-emerald-400">{done}</p> : null}
    </section>
  );
}
