import nodemailer from "nodemailer";

export type MailPayload = {
  subject: string;
  text: string;
  html: string;
};

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} が未設定です`);
  return v;
}

/** Gmail SMTP（アプリパスワード）で送信 */
export async function sendMail(payload: MailPayload) {
  const user = required("GMAIL_USER");
  const pass = required("GMAIL_APP_PASSWORD").replace(/\s+/g, "");
  const to = required("MAIL_TO");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const bcc = process.env.MAIL_BCC?.trim() || undefined;

  const info = await transporter.sendMail({
    from: `"半導体インテリジェンス" <${user}>`,
    to,
    bcc,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  return info;
}
