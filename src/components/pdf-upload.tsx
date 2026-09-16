"use client";

import { useRef, useState } from "react";
import { appLimits } from "@/lib/file-utils";

type PdfUploadProps = {
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  onSelect: (files: File[]) => void;
  onClear?: () => void;
};

export function PdfUpload({ multiple = false, maxFiles = appLimits.maxFilesPerOperation, label = "Drop PDF files here", onSelect, onClear }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (files: File[]) => {
    if (files.length === 0) return;

    const selectedFiles = multiple ? files : files.slice(0, 1);

    if (multiple && selectedFiles.length > maxFiles) {
      setError(`Please choose no more than ${maxFiles} PDF files at a time.`);
      return;
    }

    for (const file of selectedFiles) {
      const valid = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!valid) {
        setError(`Unsupported file: ${file.name}. Please upload a valid PDF.`);
        return;
      }
    }

    setError(null);
    onSelect(selectedFiles);
    if (inputRef.current) inputRef.current.value = "";
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
          dragging ? "border-zinc-200 bg-white/10" : "border-white/25 bg-white/[0.04] hover:border-zinc-400"
        }`}
      >
        <p className="text-lg font-semibold text-white">{label}</p>
        <p className="mt-2 text-sm text-zinc-400">Drag and drop or click to browse</p>
        <p className="mt-3 text-xs text-zinc-500">{multiple ? `Up to ${maxFiles} PDF files` : "Only one PDF file"} • PDF format supported</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="application/pdf,.pdf"
          multiple={multiple}
          onChange={(event) => validate(Array.from(event.target.files ?? []))}
        />
      </div>
      {onClear ? (
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            onClear();
          }}
          className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white"
        >
          × Choose a different file
        </button>
      ) : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
