import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { compare } from "bcryptjs";

const providers: any[] = [];

const hasGoogle =
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
  Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
if (hasGoogle) {
  providers.push(Google);
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
  session: { strategy: "jwt" }, // Always use JWT strategy for compatibility with Credentials provider
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        // @ts-expect-error augment at runtime
        session.user.id = token.id;
      }
      return session;
    },
  },
});


