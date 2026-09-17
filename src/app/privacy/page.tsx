import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | PDF Toolkit",
  description: "Privacy information for PDF Toolkit.",
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-8 py-8 text-zinc-200 sm:py-14">
      <div className="space-y-3">
        <Link href="/" className="text-sm text-zinc-300 hover:text-white">← PDF Toolkit</Link>
        <h1 className="text-4xl font-semibold text-white">Privacy Policy</h1>
        <p className="text-sm text-zinc-400">Last updated: September 17, 2026</p>
      </div>

      <div className="space-y-8 rounded-2xl border border-white/20 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">What PDF Toolkit does</h2>
          <p>PDF Toolkit provides browser-based tools for merging, splitting, cropping, and inserting pages in PDF documents.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">PDF files and personal information</h2>
          <p>PDF documents may contain personal information. PDF processing normally happens in your browser, and files selected for processing are not sent to PDF Toolkit by the browser-only tools.</p>
          <p>When durable result storage is enabled, generated PDF results are uploaded to the application server and stored in PostgreSQL for a limited period. A result link is required to retrieve a stored result. Results are configured to expire after 24 hours by default.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Information we collect</h2>
          <p>PDF Toolkit does not require an account and does not intentionally collect names, email addresses, payment information, contacts, or precise location data.</p>
          <p>The hosting provider may process ordinary technical information such as IP address, request time, browser details, and security logs to operate and protect the service.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Browser storage</h2>
          <p>Generated results may be stored in your browser&apos;s memory and IndexedDB so that a result remains available after a page refresh. You can remove this data by clearing site data for PDF Toolkit in your browser.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Retention and deletion</h2>
          <p>Server-stored generated results expire automatically after the configured retention period, which is 24 hours by default. Browser-stored results remain until removed by the browser or cleared by you.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Security</h2>
          <p>Use HTTPS when accessing PDF Toolkit. Do not share result links containing documents you want to keep private. Anyone who obtains a result link may be able to retrieve that result while it is available.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Changes and contact</h2>
          <p>This policy may be updated when the application or its data practices change. For support about the application, visit the <Link href="/dashboard" className="text-cyan-200 underline hover:text-cyan-100">PDF Toolkit dashboard</Link>.</p>
        </section>
      </div>
    </section>
  );
}
