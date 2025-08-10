import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [Google],
  pages: { signIn: "/sign-in" },
  callbacks: {
    jwt({ token, user }) {
      if (user) (token as any).id = (user as any).id;
      return token;
    },
    session({ session, token }) {
      if (token && (token as any).id) (session.user as any).id = (token as any).id;
      return session;
    },
  },
} satisfies NextAuthConfig;


