import { NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "@/auth";

const VerifySchema = z.object({ email: z.string().email(), code: z.string().min(6).max(6) });

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const { email, code } = parsed.data;
  return signIn("credentials", { email, code, redirectTo: "/dashboard" });
}


