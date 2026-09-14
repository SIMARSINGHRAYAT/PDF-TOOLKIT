"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="border-b border-zinc-800 bg-black/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="text-xl font-semibold tracking-wide text-white">
          PDF Toolkit
        </Link>
        <nav className="flex items-center gap-6 text-sm text-zinc-300">
          <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
          <Link href="/" className="hover:text-white transition">Welcome</Link>
        </nav>
      </div>
    </header>
  );
}
