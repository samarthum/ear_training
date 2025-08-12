"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/marketing/BrandMark";
import Link from "next/link";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const requestOtp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed");
      setMessage("If that email is valid, a code was sent.");
    } catch {
      setMessage("If that email is valid, a code was sent.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) throw new Error("Failed");
      router.push("/dashboard");
    } catch {
      setMessage("Invalid code or expired.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen marketing-hero-bg marketing-grid-overlay">
      <div className="flex flex-col justify-center items-center min-h-screen p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[color:var(--brand-text)] mb-4"
          >
            <BrandMark />
            <span className="font-semibold tracking-tight text-xl">Ear Training</span>
          </Link>
          <h1 className="text-3xl font-bold text-[color:var(--brand-text)] mb-2">Welcome back</h1>
          <p className="text-[color:var(--brand-muted)]">Sign in to continue your practice</p>
        </div>

        {/* Sign-in Panel */}
        <div className="w-full max-w-md rounded-xl p-8 border border-[color:var(--brand-line)] bg-brand-panel">
          <div className="space-y-6">
            <Button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              variant="brandPrimary"
              size="lg"
              className="w-full"
            >
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[color:var(--brand-line)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[color:var(--brand-panel)] px-3 text-[color:var(--brand-muted)]">
                  Or use email code
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[color:var(--brand-text)] mb-2 block">
                  Email address
                </label>
                <input
                  type="email"
                  className="w-full border border-[color:var(--brand-line)] rounded-lg px-3 py-2 bg-[color:var(--brand-bg)] text-[color:var(--brand-text)] placeholder-[color:var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-ring)]"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={requestOtp}
                  disabled={loading || !email}
                  variant="brand"
                  className="flex-1"
                >
                  {loading ? "Sending..." : "Get code"}
                </Button>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-24 border border-[color:var(--brand-line)] rounded-lg px-3 py-2 bg-[color:var(--brand-bg)] text-[color:var(--brand-text)] text-center placeholder-[color:var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-ring)]"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Button
                  onClick={verifyOtp}
                  disabled={loading || !email || code.length !== 6}
                  variant="brandPrimary"
                  className="flex-1"
                >
                  {loading ? "Verifying..." : "Sign in"}
                </Button>
              </div>
            </div>

            {message && (
              <p className="text-sm text-[color:var(--brand-muted)] text-center">
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[color:var(--brand-muted)] text-sm mt-8 text-center">
          New to Ear Training?{" "}
          <Link href="/" className="text-[color:var(--brand-accent)] hover:underline">
            Learn more about our approach
          </Link>
        </p>
      </div>
    </div>
  );
}


