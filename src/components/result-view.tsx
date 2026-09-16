"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizePdfFilename, saveBlob } from "@/lib/file-utils";
import { getPdfResultAsync } from "@/lib/result-store";
import { getPdfPageCount } from "@/lib/pdf-render";
import { PdfPagePreview } from "@/components/pdf-page-preview";

type ResultViewProps = {
  id: string;
};

export function ResultView({ id }: ResultViewProps) {
  const router = useRouter();
  const [result, setResult] = useState<Awaited<ReturnType<typeof getPdfResultAsync>>>(null);
  const [loading, setLoading] = useState(true);
  const [filename, setFilename] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [previewPage, setPreviewPage] = useState(1);

  useEffect(() => {
    let active = true;
    void getPdfResultAsync(id).then((loaded) => {
      if (!active) return;
      setResult(loaded);
      setLoading(false);
      if (!loaded) return;
      return loaded.blob.arrayBuffer().then(async (data) => {
        const count = await getPdfPageCount(data);
        if (!active) return;
        setPreviewData(data);
        setPageCount(count);
        setPreviewPage(1);
      });
    }).catch(() => {
      if (active) {
        setLoading(false);
        setPreviewData(null);
      }
    });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <section className="mx-auto max-w-3xl space-y-4"><p className="text-zinc-300">Loading your PDF...</p></section>;
  }

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

      {previewData ? <PdfPagePreview data={previewData} pageCount={pageCount} page={previewPage} onPageChange={setPreviewPage} label="Generated PDF preview" /> : <p className="text-sm text-zinc-400">Loading PDF preview...</p>}

      <div className="rounded-2xl border border-white/20 bg-white/[0.04] p-4 backdrop-blur-sm">
        <label htmlFor="filename" className="text-sm text-zinc-300">File Name</label>
        <input
          id="filename"
          value={filename ?? ""}
          onChange={(event) => setFilename(event.target.value)}
          className="mt-2 w-full px-3 py-2 text-base"
          placeholder="Enter a file name, for example merged-document.pdf"
        />
        <button
          type="button"
          disabled={!filename?.trim()}
          onClick={() => void saveBlob(result.blob, normalizePdfFilename(filename ?? "", result.defaultFilename))}
          className="mt-4 rounded-xl border border-zinc-400 bg-zinc-900 px-5 py-3 text-base font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download PDF
        </button>
      </div>

      {result.sourcePath === "/crop-pdf" ? (
        <Link href="/crop-pdf" className="inline-flex rounded-xl border border-cyan-200/40 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/20">
          Re-crop this PDF
        </Link>
      ) : null}
    </section>
  );
}
