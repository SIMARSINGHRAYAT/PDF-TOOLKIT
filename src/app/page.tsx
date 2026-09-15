import Link from "next/link";

export default function WelcomePage() {
  return (
    <section className="flex min-h-[88vh] items-center justify-center text-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-6xl font-bold tracking-tight text-white sm:text-8xl">PDF Toolkit</h1>
        <div className="mt-8 flex items-center justify-center gap-4 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-200 sm:text-base">
          <span>Merge</span><span className="text-yellow-300">•</span><span>Split</span><span className="text-blue-300">•</span><span>Crop</span>
        </div>
        <blockquote className="mx-auto mt-14 max-w-xl text-lg italic text-zinc-300 sm:text-xl">
          “Simple tools. Smarter documents.”
          <cite className="mt-3 block text-sm text-zinc-500">- PDF Toolkit</cite>
        </blockquote>
        <div className="mt-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-white/60 bg-white px-8 py-4 text-lg font-semibold text-black shadow-[0_0_35px_rgba(255,255,255,0.18)] transition hover:bg-yellow-200 active:scale-[0.99]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
