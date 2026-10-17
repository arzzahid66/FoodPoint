import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guard";
import { getPendingSummary } from "@/server/services/orders";

export const dynamic = "force-dynamic";

/** Lightweight endpoint the admin UI polls to detect new orders. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json(await getPendingSummary());
}
