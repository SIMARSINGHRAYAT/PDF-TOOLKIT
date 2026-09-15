import Link from "next/link";

const tools = [
  {
    title: "Crop Your PDF",
    href: "/crop-pdf",
    desc: "Crop pages from a PDF with a visual preview.",
  },
  {
    title: "Split PDF",
    href: "/split-pdf",
    desc: "Split a PDF into separate pages or documents.",
  },
  {
    title: "Merge Multiple PDFs",
    href: "/merge-pdf",
    desc: "Combine multiple PDF files into one document.",
  },
];

export default function DashboardPage() {
  return (
    <section className="space-y-8 py-10 sm:py-16">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-300">Choose a tool</p>
        <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Make your PDF move.</h1>
        <p className="mt-3 text-lg text-zinc-300">Fast, focused tools for the pages that matter.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-2xl border border-white/20 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:border-white/60 hover:bg-white/[0.1]"
          >
            <h2 className="text-2xl font-semibold text-white">{tool.title}</h2>
            <p className="mt-3 text-base text-zinc-300">{tool.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
