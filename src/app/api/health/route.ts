import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: false, reason: "database_not_configured" }, { status: 503 });
  }

  try {
    const { db } = await import("@/db");
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
