"use client";

import { useRef, useState } from "react";

type PdfUploadProps = {
  multiple?: boolean;
  label?: string;
  onSelect: (files: File[]) => void;
};

export function PdfUpload({ multiple = false, label = "Drop PDF files here", onSelect }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (files: File[]) => {
    if (files.length === 0) return;

    for (const file of files) {
      const valid = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!valid) {
        setError(`Unsupported file: ${file.name}. Please upload a valid PDF.`);
        return;
      }
    }

    setError(null);
    onSelect(files);
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          validate(Array.from(event.dataTransfer.files));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Upload PDF files"
        className={`rounded-2xl border border-dashed px-6 py-12 text-center ${
          dragging ? "border-zinc-200 bg-zinc-900" : "border-zinc-700 bg-zinc-950 hover:border-zinc-400"
        }`}
      >
        <p className="text-lg font-semibold text-white">{label}</p>
        <p className="mt-2 text-sm text-zinc-400">Drag and drop or click to browse</p>
        <p className="mt-3 text-xs text-zinc-500">PDF files supported • Large files welcome</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="application/pdf,.pdf"
          multiple={multiple}
          onChange={(event) => validate(Array.from(event.target.files ?? []))}
        />
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
