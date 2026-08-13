import { Resend } from "resend";

let cachedClient: Resend | null = null;

/**
 * Lazily-constructed Resend client. Notification sends are best-effort —
 * callers should catch and log, never let a missing/invalid API key take
 * down the request that triggered the notification.
 */
export function getResendClient(): Resend {
  if (!cachedClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

// Sender address — must be on a domain verified in the Resend dashboard.
// Override with NOTIFY_FROM_EMAIL once wwllcs.com (or a subdomain) is
// verified with Resend.
export const NOTIFY_FROM =
  process.env.NOTIFY_FROM_EMAIL || "SaddleMatch <notifications@wwllcs.com>";
