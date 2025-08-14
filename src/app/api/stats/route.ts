export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserStats, StatsRange } from "@/lib/stats";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range") as StatsRange | null;
  const range: StatsRange = rangeParam === "30d" || rangeParam === "all" ? rangeParam : "7d";

  const stats = await getUserStats(session.user.id, range);
  return NextResponse.json(stats);
}


