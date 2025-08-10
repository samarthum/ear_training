import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { compare } from "bcryptjs";

const providers: any[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google);
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

providers.push(
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      code: { label: "Code", type: "text" },
    },
    authorize: async (credentials) => {
      if (!credentials?.email || !credentials?.code) return null;
      const record = await prisma.otpCode.findFirst({
        where: {
          identifier: credentials.email,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!record) return null;
      const ok = await compare(credentials.code as string, record.codeHash);
      if (!ok) {
        await prisma.otpCode.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } },
        });
        return null;
      }
      await prisma.otpCode.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
      let user = await prisma.user.findFirst({ where: { email: credentials.email as string } });
      if (!user) {
        user = await prisma.user.create({ data: { email: credentials.email as string } });
      }
      return { id: user.id, email: user.email ?? undefined } as any;
    },
  })
);

const useAdapter = Boolean(process.env.DATABASE_URL);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? "dev-secret",
  adapter: useAdapter ? (PrismaAdapter(prisma) as any) : undefined,
  session: { strategy: useAdapter ? "database" : "jwt" },
  providers,
  callbacks: {
    async session({ session, user, token }) {
      const userId = (user as any)?.id ?? (token as any)?.id;
      if (userId) {
        // @ts-expect-error augment at runtime
        session.user.id = userId;
      }
      return session;
    },
  },
});


