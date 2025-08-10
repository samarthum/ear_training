import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hash } from "bcryptjs";

const RequestSchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const { email } = parsed.data;

  // Throttle: deny if there is an unexpired code
  const existing = await prisma.otpCode.findFirst({
    where: { identifier: email, consumedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existing) {
    return NextResponse.json({ ok: true });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.otpCode.create({ data: { identifier: email, codeHash, expiresAt } });

  // TODO: send email via provider; intentionally do not disclose existence
  console.log(`[otp] Sent code ${code} to ${email}`);

  return NextResponse.json({ ok: true });
}


