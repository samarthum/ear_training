"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const sessionHook = useSession();
  const status = sessionHook?.status ?? "unauthenticated";
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
      window.location.href = "/dashboard";
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
    <div className="container mx-auto p-8 max-w-lg">
      <h1 className="text-3xl font-bold mb-6">Sign in</h1>
      <div className="space-y-4">
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full rounded-md bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700"
        >
          Continue with Google
        </button>

        <div className="border-t pt-4">
          <h2 className="font-semibold mb-2">OTP Code</h2>
          <div className="space-y-2">
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={requestOtp}
                disabled={loading || !email}
                className="flex-1 rounded-md bg-gray-100 px-4 py-2 border hover:bg-gray-200"
              >
                Request code
              </button>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="w-28 border rounded-md px-3 py-2"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                onClick={verifyOtp}
                disabled={loading || !email || code.length !== 6}
                className="flex-1 rounded-md bg-black text-white px-4 py-2 font-semibold hover:opacity-90"
              >
                Verify & sign in
              </button>
            </div>
          </div>
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}


