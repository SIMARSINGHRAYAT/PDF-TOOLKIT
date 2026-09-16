import { and, eq, gt } from "drizzle-orm";
import { pdfResults } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  if (!process.env.DATABASE_URL) return Response.json({ error: "Result unavailable." }, { status: 404 });
  const { id } = await params;

  try {
    const { db } = await import("@/db");
    const [result] = await db.select().from(pdfResults).where(and(eq(pdfResults.id, id), gt(pdfResults.expiresAt, new Date()))).limit(1);
    if (!result) return Response.json({ error: "Result unavailable or expired." }, { status: 404 });

    return new Response(new Uint8Array(result.pdf) as unknown as BodyInit, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${result.defaultFilename.replace(/[^a-zA-Z0-9._-]/g, "-")}"`,
        "X-PDF-Default-Filename": encodeURIComponent(result.defaultFilename),
        "X-PDF-Heading": encodeURIComponent(result.heading),
        "X-PDF-Source-Path": encodeURIComponent(result.sourcePath),
        "X-PDF-Success-Message": encodeURIComponent(result.successMessage),
      },
    });
  } catch {
    return Response.json({ error: "Result storage is temporarily unavailable." }, { status: 503 });
  }
}