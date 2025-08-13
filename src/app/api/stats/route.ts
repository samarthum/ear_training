export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserStats } from "@/lib/stats";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getUserStats(session.user.id);
  return NextResponse.json(stats);
}


