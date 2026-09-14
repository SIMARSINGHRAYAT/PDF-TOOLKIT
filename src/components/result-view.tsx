"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizePdfFilename, triggerDownload } from "@/lib/file-utils";
import { getPdfResult } from "@/lib/result-store";

type ResultViewProps = {
  id: string;
};

export function ResultView({ id }: ResultViewProps) {
  const router = useRouter();
  const [filename, setFilename] = useState("merged-document.pdf");
  const result = useMemo(() => getPdfResult(id), [id]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!result) return;
    setFilename(result.defaultFilename);
    const url = URL.createObjectURL(result.blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  if (!result) {
    return (
      <section className="mx-auto max-w-3xl space-y-4">
        <button type="button" onClick={() => router.back()} className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white">
          ← Back
        </button>
        <h1 className="text-3xl font-semibold text-white">Result unavailable</h1>
        <p className="text-zinc-300">The generated file is no longer available. Please process your PDF again.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Link href={result.sourcePath} className="inline-flex px-3 py-1.5 text-sm text-zinc-300 hover:text-white">
        ← Back
      </Link>

      <div>
        <h1 className="text-4xl font-semibold text-white">{result.heading}</h1>
        <p className="mt-2 text-lg text-zinc-300">{result.successMessage}</p>
      </div>

      <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
        <p className="mb-3 text-sm text-zinc-400">PDF Preview</p>
        {previewUrl ? (
          <iframe title="Generated PDF preview" src={previewUrl} className="h-[65vh] min-h-[420px] w-full rounded-xl border border-zinc-700" />
        ) : (
          <p className="text-sm text-zinc-400">Loading PDF preview...</p>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4">
        <label htmlFor="filename" className="text-sm text-zinc-300">File Name</label>
        <input
          id="filename"
          value={filename}
          onChange={(event) => setFilename(event.target.value)}
          className="mt-2 w-full px-3 py-2 text-base"
          placeholder="merged-document.pdf"
        />
        <button
          type="button"
          onClick={() => triggerDownload(result.blob, normalizePdfFilename(filename, result.defaultFilename))}
          className="mt-4 rounded-xl border border-zinc-400 bg-zinc-900 px-5 py-3 text-base font-semibold text-white hover:bg-zinc-800"
        >
          Download PDF
        </button>
      </div>
    </section>
  );
}
