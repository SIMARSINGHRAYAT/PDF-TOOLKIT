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
    <section className="space-y-8">
      <h1 className="text-4xl font-semibold text-white">Dashboard</h1>
      <p className="text-lg text-zinc-300">Choose one operation to start processing your PDF files.</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="rounded-2xl border border-zinc-700 bg-zinc-950 p-6 hover:border-zinc-300 hover:bg-zinc-900"
          >
            <h2 className="text-2xl font-semibold text-white">{tool.title}</h2>
            <p className="mt-3 text-base text-zinc-300">{tool.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
