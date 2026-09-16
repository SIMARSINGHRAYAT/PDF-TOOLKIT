"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PdfUpload } from "@/components/pdf-upload";
import { appLimits, withSuffix } from "@/lib/file-utils";
import { getPdfPageCount, renderPdfPageForEditor } from "@/lib/pdf-render";
import { cropPdf } from "@/lib/pdf-tools";
import { savePdfResult } from "@/lib/result-store";

type Rect = { x: number; y: number; w: number; h: number };

type DragState = {
  mode: "draw" | "move" | "resize";
  startX: number;
  startY: number;
  startRect: Rect;
};

function toPdfBlob(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

export function CropTool() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [page, setPage] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<{
    dataUrl: string;
    pageWidth: number;
    pageHeight: number;
    renderWidth: number;
    renderHeight: number;
  } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState(false);

  const dragRef = useRef<DragState | null>(null);

  const scale = useMemo(() => {
    if (!preview) return 1;
    return preview.renderWidth / preview.pageWidth;
  }, [preview]);

  const loadPreview = async (selected: File, targetPage: number) => {
    try {
      setPreviewLoading(true);
      const buffer = await selected.arrayBuffer();
      const rendered = await renderPdfPageForEditor(buffer, targetPage, 850);
      setPreview(rendered);
      setRect(null);
    } catch {
      setError("Preview unavailable. The PDF could not be rendered.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const onFile = async (selected: File | null) => {
    setFile(selected);
    setResultId(null);
    setDone(null);
    setError(null);
    setPreview(null);
    setRect(null);
    setCropMode(false);

    if (!selected) return;

    try {
      const count = await getPdfPageCount(await selected.arrayBuffer());
      if (count > appLimits.maxPagesPerDocument) {
        setPageCount(0);
        setError(`This PDF exceeds the ${appLimits.maxPagesPerDocument}-page limit.`);
        return;
      }
      setPageCount(count);
      setPage(1);
      await loadPreview(selected, 1);
    } catch {
      setError("Unable to open this PDF. Please select a valid PDF file.");
    }
  };

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!dragRef.current || !preview) return;
      const dx = event.clientX - dragRef.current.startX;
      const dy = event.clientY - dragRef.current.startY;
      const next = { ...dragRef.current.startRect };

      if (dragRef.current.mode === "draw") {
        next.x = Math.max(0, Math.min(dragRef.current.startRect.x, dragRef.current.startRect.x + dx));
        next.y = Math.max(0, Math.min(dragRef.current.startRect.y, dragRef.current.startRect.y + dy));
        next.w = Math.max(24, Math.abs(dx));
        next.h = Math.max(24, Math.abs(dy));
      } else if (dragRef.current.mode === "move") {
        next.x = Math.min(Math.max(0, dragRef.current.startRect.x + dx), preview.renderWidth - next.w);
        next.y = Math.min(Math.max(0, dragRef.current.startRect.y + dy), preview.renderHeight - next.h);
      } else {
        next.w = Math.min(Math.max(24, dragRef.current.startRect.w + dx), preview.renderWidth - next.x);
        next.h = Math.min(Math.max(24, dragRef.current.startRect.h + dy), preview.renderHeight - next.y);
      }

      if (next.x + next.w > preview.renderWidth) next.w = preview.renderWidth - next.x;
      if (next.y + next.h > preview.renderHeight) next.h = preview.renderHeight - next.y;
      setRect(next);
    };

    const onUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [preview]);

  const applyCrop = async () => {
    if (!file || !preview) {
      setError("Please upload a PDF first.");
      return;
    }

    if (!rect || rect.w < 24 || rect.h < 24) {
      setError("Please select a valid crop area before cropping.");
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setDone(null);
      setResultId(null);

      const pdfX = rect.x / scale;
      const pdfWidth = rect.w / scale;
      const pdfHeight = rect.h / scale;
      const pdfY = preview.pageHeight - (rect.y + rect.h) / scale;

      const bytes = await cropPdf(
        await file.arrayBuffer(),
        {
          x: pdfX,
          y: pdfY,
          width: pdfWidth,
          height: pdfHeight,
        },
        [page],
      );

      const id = savePdfResult({
        blob: toPdfBlob(bytes),
        defaultFilename: withSuffix(file.name, "cropped", "pdf"),
        heading: "Cropped PDF Ready",
        sourcePath: "/crop-pdf",
        successMessage: "Crop PDF completed successfully.",
      });

      setResultId(id);
      setDone("Crop PDF completed successfully.");
      router.push(`/result/${id}`);
    } catch {
      setError("We couldn't crop this PDF. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Crop Your PDF</h1>
        <Link href="/dashboard" className="text-sm text-zinc-300 hover:text-white">← Back</Link>
      </div>

      <PdfUpload onSelect={(incoming) => void onFile(incoming[0] ?? null)} onClear={() => void onFile(null)} label="Upload a PDF to crop" />

      {file && pageCount > 0 ? (
        <div className="rounded-2xl border border-white/20 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5">
          <div className="flex items-center justify-between gap-3 text-sm text-zinc-300">
            <button
              type="button"
              onClick={async () => {
                if (!file || page <= 1) return;
                setResultId(null);
                setDone(null);
                const next = page - 1;
                setPage(next);
                await loadPreview(file, next);
              }}
              disabled={page <= 1}
              className="px-3 py-1.5 disabled:opacity-40"
            >
              Previous page
            </button>
            <span>Page {page} of {pageCount}</span>
            <button
              type="button"
              onClick={async () => {
                if (!file || page >= pageCount) return;
                setResultId(null);
                setDone(null);
                const next = page + 1;
                setPage(next);
                await loadPreview(file, next);
              }}
              disabled={page >= pageCount}
              className="px-3 py-1.5 disabled:opacity-40"
            >
              Next page
            </button>
            <button
              type="button"
              onClick={() => {
                if (rect) {
                  void applyCrop();
                } else {
                  setCropMode(true);
                }
              }}
              disabled={processing}
              className="rounded-xl border border-white/50 bg-white/10 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {processing ? "Applying crop..." : rect ? "Apply Crop" : "Crop PDF"}
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-400">Select Crop PDF, then drag across the page. Drag inside the black grid to move it, or drag the corner to resize it.</p>

          <div className="relative mt-4 w-full overflow-auto rounded-xl border border-zinc-700 bg-black p-3">
            {previewLoading ? <p className="p-8 text-sm text-zinc-400">Loading PDF preview...</p> : null}

            {preview ? (
              <div className="relative mx-auto" style={{ width: preview.renderWidth, height: preview.renderHeight }}>
                <img
                  src={preview.dataUrl}
                  alt={`Preview page ${page}`}
                  className="h-full w-full select-none"
                  draggable={false}
                  onMouseDown={(event) => {
                    if (!cropMode) return;
                    if ((event.target as HTMLElement).closest("[data-crop-rect]")) return;
                    setResultId(null);
                    setDone(null);
                    const bounds = (event.currentTarget as HTMLImageElement).getBoundingClientRect();
                    const x = Math.max(0, Math.min(event.clientX - bounds.left, preview.renderWidth));
                    const y = Math.max(0, Math.min(event.clientY - bounds.top, preview.renderHeight));
                    const initial = { x, y, w: 1, h: 1 };
                    setRect(initial);
                    dragRef.current = {
                      mode: "draw",
                      startX: event.clientX,
                      startY: event.clientY,
                      startRect: initial,
                    };
                  }}
                />

                {rect ? (
                  <div
                    data-crop-rect
                    className="absolute border-[3px] border-black bg-[repeating-linear-gradient(0deg,transparent,transparent_11px,rgba(0,0,0,0.9)_12px),repeating-linear-gradient(90deg,transparent,transparent_11px,rgba(0,0,0,0.9)_12px)] shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"
                    style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      dragRef.current = {
                        mode: "move",
                        startX: event.clientX,
                        startY: event.clientY,
                        startRect: rect,
                      };
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Resize crop area"
                      className="absolute -bottom-2 -right-2 h-5 w-5 rounded-sm border-2 border-black bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.8)]"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        dragRef.current = {
                          mode: "resize",
                          startX: event.clientX,
                          startY: event.clientY,
                          startRect: rect,
                        };
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {resultId ? (
              <button
                type="button"
                onClick={() => router.push(`/result/${resultId}`)}
                className="rounded-xl border border-white/30 bg-white/[0.04] px-5 py-3 text-base font-semibold text-white hover:bg-white/10"
              >
                Download Cropped PDF
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {done ? <p className="text-sm text-emerald-400">{done}</p> : null}
    </section>
  );
}
