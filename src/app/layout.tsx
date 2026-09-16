import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Toolkit",
  description: "Simple, fast PDF tools for cropping, splitting, and merging documents.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
