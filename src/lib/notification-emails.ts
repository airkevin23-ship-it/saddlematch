import { APP_NAME } from "@/lib/constants";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wwllcs.com";

function wrap(inner: string) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#fdf6ec; padding:32px 16px;">
    <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px; border:1px solid #eee;">
      <p style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#b3472b; margin:0 0 12px;">
        ${APP_NAME}
      </p>
      ${inner}
      <p style="font-size:11px; color:#999; margin-top:32px;">
        You're receiving this because you have an account on ${APP_NAME}.
        You can turn off these emails anytime in
        <a href="${SITE_URL}/app/settings" style="color:#b3472b;">Settings</a>.
      </p>
    </div>
  </div>`;
}

export function matchEmail(params: { recipientName: string; otherName: string; matchId: string }) {
  const { recipientName, otherName, matchId } = params;
  const url = `${SITE_URL}/app/matches/${matchId}`;
  return {
    subject: `You and ${otherName} matched on ${APP_NAME} 🤠`,
    html: wrap(`
      <h1 style="font-size:20px; margin:0 0 12px;">Hey ${recipientName}, it's a match!</h1>
      <p style="font-size:14px; color:#444; line-height:1.5;">
        You and <strong>${otherName}</strong> liked each other. Say hi before the conversation goes cold.
      </p>
      <a href="${url}" style="display:inline-block; margin-top:16px; background:#b3472b; color:#fff; text-decoration:none; font-weight:700; font-size:14px; padding:12px 20px; border-radius:999px;">
        Send a message
      </a>
    `),
  };
}

export function messageEmail(params: {
  recipientName: string;
  senderName: string;
  preview: string;
  matchId: string;
}) {
  const { recipientName, senderName, preview, matchId } = params;
  const url = `${SITE_URL}/app/matches/${matchId}`;
  const trimmed = preview.length > 140 ? `${preview.slice(0, 140)}…` : preview;
  return {
    subject: `${senderName} sent you a message on ${APP_NAME}`,
    html: wrap(`
      <h1 style="font-size:20px; margin:0 0 12px;">Hey ${recipientName}, new message</h1>
      <p style="font-size:14px; color:#444; line-height:1.5;">
        <strong>${senderName}:</strong> "${trimmed}"
      </p>
      <a href="${url}" style="display:inline-block; margin-top:16px; background:#b3472b; color:#fff; text-decoration:none; font-weight:700; font-size:14px; padding:12px 20px; border-radius:999px;">
        Reply
      </a>
    `),
  };
}
