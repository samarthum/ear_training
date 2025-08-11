export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const subject = "Your login code";
  const html = `<p>Your code is <strong>${code}</strong>. It expires in 10 minutes.</p>`;
  const text = `Your code is ${code}. It expires in 10 minutes.`;

  if (!apiKey) {
    // Fallback: console log in dev if provider not configured
    console.log(`[otp] (no email provider) code ${code} -> ${to}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[otp] resend error ${res.status}: ${body}`);
    // Do not throw; we don't want to disclose delivery issues to the client
  }
}


