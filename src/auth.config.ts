import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [Google],
  pages: { signIn: "/sign-in" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token && token.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;


