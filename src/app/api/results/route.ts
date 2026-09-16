import { eq } from "drizzle-orm";
import { pdfResults } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const maxResultBytes = Number(process.env.PDF_RESULT_MAX_BYTES ?? 25 * 1024 * 1024);
const resultTtlMs = Number(process.env.PDF_RESULT_TTL_MS ?? 24 * 60 * 60 * 1000);
const idPattern = /^[a-zA-Z0-9-]{20,80}$/;

function unavailable() {
  return Response.json({ error: "Result storage is not configured." }, { status: 503 });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return unavailable();

  const formData = await request.formData();
  const id = String(formData.get("id") ?? "");
  const file = formData.get("file");

  if (!idPattern.test(id) || !(file instanceof File)) {
    return Response.json({ error: "Invalid result payload." }, { status: 400 });
  }

  if (file.type !== "application/pdf" || file.size === 0 || file.size > maxResultBytes) {
    return Response.json({ error: "The generated PDF is too large or invalid." }, { status: 413 });
  }

  const defaultFilename = String(formData.get("defaultFilename") ?? "document.pdf");
  const heading = String(formData.get("heading") ?? "PDF Ready");
  const sourcePath = String(formData.get("sourcePath") ?? "/dashboard");
  const successMessage = String(formData.get("successMessage") ?? "Your PDF is ready.");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + resultTtlMs);
  const pdf = Buffer.from(await file.arrayBuffer());

  try {
    const { db } = await import("@/db");
    await db.insert(pdfResults).values({
      id,
      pdf,
      defaultFilename,
      heading,
      sourcePath,
      successMessage,
      sizeBytes: file.size,
      createdAt,
      expiresAt,
    }).onConflictDoUpdate({
      target: pdfResults.id,
      set: { pdf, defaultFilename, heading, sourcePath, successMessage, sizeBytes: file.size, createdAt, expiresAt },
    });

    return Response.json({ id, expiresAt: expiresAt.toISOString() }, { status: 201 });
  } catch {
    return Response.json({ error: "Result storage is temporarily unavailable." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return unavailable();
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!idPattern.test(id)) return Response.json({ error: "Invalid result id." }, { status: 400 });

  try {
    const { db } = await import("@/db");
    await db.delete(pdfResults).where(eq(pdfResults.id, id));
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Result storage is temporarily unavailable." }, { status: 503 });
  }
}