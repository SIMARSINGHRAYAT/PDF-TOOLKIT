"use client";

import { useEffect, useState } from "react";
import { renderPdfPageForEditor } from "@/lib/pdf-render";

type PdfPagePreviewProps = {
  data: ArrayBuffer | null;
  pageCount: number;
  page: number;
  onPageChange: (page: number) => void;
  label?: string;
};

export function PdfPagePreview({ data, pageCount, page, onPageChange, label = "PDF preview" }: PdfPagePreviewProps) {
  const [image, setImage] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!data || pageCount === 0) {
      return () => {
        active = false;
      };
    }

    const renderKey = `${page}-${data.byteLength}`;
    void renderPdfPageForEditor(data, page, 900)
      .then((rendered) => {
        if (active) {
          setImage(rendered.dataUrl);
          setImageKey(renderKey);
        }
      })
      .catch(() => {
        if (active) setImageKey(renderKey);
      });

    return () => {
      active = false;
    };
  }, [data, page, pageCount]);

  return (
    <div className="rounded-2xl border border-white/20 bg-white/[0.04] p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-zinc-300">
        <span>{label}</span>
        <span>Page {page} of {pageCount}</span>
      </div>
      <div className="flex min-h-[420px] items-center justify-center overflow-auto rounded-xl border border-white/15 bg-black/40 p-3">
        {imageKey !== `${page}-${data?.byteLength ?? 0}` ? <p className="text-sm text-zinc-400">Rendering page preview...</p> : null}
        {imageKey === `${page}-${data?.byteLength ?? 0}` && image ? <img src={image} alt={`${label}, page ${page}`} className="max-h-[72vh] w-auto max-w-full object-contain" /> : null}
        {imageKey === `${page}-${data?.byteLength ?? 0}` && !image ? <p className="text-sm text-zinc-400">Preview unavailable for this page.</p> : null}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm disabled:opacity-40">
          Previous page
        </button>
        <button type="button" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount} className="px-3 py-1.5 text-sm disabled:opacity-40">
          Next page
        </button>
      </div>
    </div>
  );
}