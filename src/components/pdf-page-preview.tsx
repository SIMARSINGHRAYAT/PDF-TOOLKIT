"use client";

import { useEffect, useState } from "react";
import { renderPdfPageForEditor } from "@/lib/pdf-render";

const dataIds = new WeakMap<ArrayBuffer, number>();
let nextDataId = 1;

function getDataId(data: ArrayBuffer): number {
  const existing = dataIds.get(data);
  if (existing) return existing;
  const id = nextDataId;
  nextDataId += 1;
  dataIds.set(data, id);
  return id;
}

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

    const renderKey = `${getDataId(data)}-${page}`;
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
      <div className="flex min-h-[420px] items-center justify-center overflow-auto rounded-xl border border-white/15 bg-white/[0.04] p-3">
        {image && imageKey === `${data ? getDataId(data) : 0}-${page}` ? <img src={image} alt={`${label}, page ${page}`} className="max-h-[72vh] w-auto max-w-full object-contain" /> : null}
        {imageKey !== `${data ? getDataId(data) : 0}-${page}` ? <p className="text-sm text-zinc-400">Preparing page preview...</p> : null}
        {imageKey === `${data ? getDataId(data) : 0}-${page}` && !image ? <p className="text-sm text-zinc-400">Preview unavailable for this page.</p> : null}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm hover:bg-white/[0.12] disabled:opacity-40">
          Previous page
        </button>
        <button type="button" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount} className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm hover:bg-white/[0.12] disabled:opacity-40">
          Next page
        </button>
      </div>
    </div>
  );
}