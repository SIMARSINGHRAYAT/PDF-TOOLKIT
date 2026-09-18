"use client";

import Link from "next/link";
import { useState } from "react";

const tools = [
  {
    title: "Crop Your PDF",
    href: "/crop-pdf",
    desc: "Crop pages from a PDF with a visual preview.",
    comingSoon: false,
  },
  {
    title: "Split PDF",
    href: "/split-pdf",
    desc: "Split a PDF into separate pages or documents.",
    comingSoon: false,
  },
  {
    title: "Merge Multiple PDFs",
    href: "/merge-pdf",
    desc: "Combine multiple PDF files into one document.",
    comingSoon: false,
  },
  {
    title: "Insert a PDF Page",
    href: "/insert-page",
    desc: "Place one page from a PDF anywhere inside another PDF.",
    comingSoon: true,
  },
];

export default function DashboardPage() {
  const [announcement, setAnnouncement] = useState<string | null>(null);

  return (
    <section className="space-y-8 py-10 sm:py-16">
      <p className="text-center text-lg font-medium uppercase tracking-[0.35em] text-emerald-300 sm:text-2xl">Choose a tool</p>
      <div className="grid gap-5 lg:grid-cols-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            onClick={(event) => {
              if (tool.comingSoon) {
                event.preventDefault();
                setAnnouncement(`${tool.title} is coming soon.`);
              }
            }}
            className={`rounded-2xl border p-7 backdrop-blur-sm transition ${tool.comingSoon ? "cursor-not-allowed border-amber-400/40 bg-amber-500/10 opacity-80 hover:-translate-y-0 hover:border-amber-300/70 hover:bg-amber-500/15" : "border-white/25 bg-white/[0.08] hover:-translate-y-1 hover:border-cyan-200/70 hover:bg-white/[0.14]"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-white">{tool.title}</h2>
              {tool.comingSoon ? (
                <span className="rounded-full border border-amber-400/60 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                  Coming soon
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      {announcement ? (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-center text-base font-medium text-amber-100">
          {announcement}
        </div>
      ) : null}
    </section>
  );
}
