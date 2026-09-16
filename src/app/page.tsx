import Link from "next/link";

export default function WelcomePage() {
  return (
    <section className="flex min-h-[92vh] items-center justify-center overflow-hidden px-4 text-center">
      <div className="w-full max-w-7xl">
        <h1 className="chrome-text text-7xl font-bold tracking-tight sm:text-9xl">PDF Toolkit</h1>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-base font-semibold uppercase tracking-[0.35em] text-cyan-100 sm:text-xl">
          <span>Merge</span><span className="text-pink-300">•</span><span>Split</span><span className="text-yellow-300">•</span><span>Crop</span><span className="text-emerald-300">•</span><span>Insert</span>
        </div>
        <blockquote className="chrome-text mx-auto mt-16 max-w-2xl text-2xl italic sm:text-3xl">
          “Simple tools. Smarter documents.”
          <cite className="mt-3 block text-sm text-zinc-500">- PDF Toolkit</cite>
        </blockquote>
        <div className="mt-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-cyan-200/60 bg-cyan-300/20 px-10 py-5 text-xl font-semibold text-white shadow-[0_0_45px_rgba(34,211,238,0.35)] backdrop-blur-sm transition hover:bg-cyan-300/30 active:scale-[0.99]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
