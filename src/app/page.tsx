import Link from "next/link";

export default function WelcomePage() {
  return (
    <section className="flex min-h-[92vh] items-center justify-center text-center">
      <div className="w-full max-w-5xl">
        <h1 className="chrome-text text-7xl font-bold tracking-tight sm:text-9xl">PDF Toolkit</h1>
        <div className="chrome-text mt-10 flex items-center justify-center gap-5 text-base font-semibold uppercase tracking-[0.35em] sm:text-xl">
          <span>Merge</span><span>•</span><span>Split</span><span>•</span><span>Crop</span>
        </div>
        <blockquote className="chrome-text mx-auto mt-16 max-w-2xl text-xl italic sm:text-2xl">
          “Simple tools. Smarter documents.”
          <cite className="mt-3 block text-sm text-zinc-500">- PDF Toolkit</cite>
        </blockquote>
        <div className="mt-12">
          <Link
            href="/dashboard"
            className="chrome-text inline-flex items-center rounded-xl border border-white/50 bg-white/10 px-10 py-5 text-xl font-semibold shadow-[0_0_35px_rgba(255,255,255,0.18)] backdrop-blur-sm transition hover:bg-white/20 active:scale-[0.99]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
