import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";

// Match the same provider logic from auth.ts for middleware compatibility
const providers: Provider[] = [];

const hasGoogle =
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
  Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

if (hasGoogle) {
  providers.push(Google);
}

// Add Credentials provider for OTP (edge-compatible version)
providers.push(
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      code: { label: "Code", type: "text" },
    },
    // Minimal authorize function for edge compatibility
    authorize: async () => null, // Actual auth happens in main auth.ts
  })
);

export default {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers,
  pages: { 
    signIn: "/sign-in" 
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token && token.id) session.user.id = token.id as string;
      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;


