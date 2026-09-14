import Link from "next/link";

const features = [
  {
    title: "Crop Your PDF",
    description: "Crop pages from a PDF with a visual preview.",
  },
  {
    title: "Split PDF",
    description: "Split a PDF into separate pages or documents.",
  },
  {
    title: "Merge Multiple PDFs",
    description: "Combine multiple PDF files into a single document.",
  },
];

export default function WelcomePage() {
  return (
    <section className="flex min-h-[88vh] items-center justify-center">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-6xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">PDF Toolkit</h1>

        <div className="mx-auto mt-14 max-w-2xl space-y-7 text-left sm:text-center">
          {features.map((item) => (
            <div key={item.title}>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">{item.title}</h2>
              <p className="mt-2 text-base text-zinc-300 sm:text-lg">{item.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-lg italic text-zinc-400 sm:text-xl">“Simple tools. Smarter documents.”</p>

        <div className="mt-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-zinc-400 bg-zinc-900 px-8 py-4 text-lg font-semibold text-white hover:bg-zinc-800 active:scale-[0.99]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
