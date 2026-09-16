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
  {
    title: "Insert a PDF Page",
    href: "/insert-page",
    desc: "Place one page from a PDF anywhere inside another PDF.",
  },
];

export default function DashboardPage() {
  return (
    <section className="space-y-8 py-10 sm:py-16">
      <p className="text-center text-lg font-medium uppercase tracking-[0.35em] text-emerald-300 sm:text-2xl">Choose a tool</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-2xl border border-white/20 bg-white/[0.04] p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:border-white/60 hover:bg-white/[0.1]"
          >
            <h2 className="text-2xl font-semibold text-white">{tool.title}</h2>
          </Link>
        ))}
      </div>
    </section>
  );
}
