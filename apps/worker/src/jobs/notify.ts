import "../lib/load-env.js";
import { prisma } from "@semiconductor/db";
import { sendMail } from "../lib/mail.js";

const DASHBOARD_URL =
  process.env.DASHBOARD_URL?.trim() ||
  "https://semiconductor-intelligence.vercel.app";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main() {
  console.log("📧 日次メール配信開始:", new Date().toLocaleString("ja-JP"));

  const daily = await prisma.dailySnapshot.findFirst({
    orderBy: { date: "desc" },
    select: { summary: true, date: true, articleCount: true, topArticles: true },
  });

  if (!daily) {
    console.log("⚠️ 日次スナップショットがありません。先に pnpm snapshot を実行してください");
    process.exit(1);
  }

  const dateLabel = new Date(daily.date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const topArticles = (daily.topArticles as {
    title?: string;
    url?: string;
    category?: string | null;
  }[]) ?? [];

  const articleLines = topArticles.slice(0, 5).map((a, i) => {
    const title = a.title ?? "(無題)";
    const cat = a.category ? `[${a.category}] ` : "";
    return `${i + 1}. ${cat}${title}${a.url ? `\n   ${a.url}` : ""}`;
  });

  const subject = `【半導体インテリジェンス】${dateLabel}`;

  const text = [
    `半導体インテリジェンス — ${dateLabel}`,
    "",
    "■ 今日のポイント",
    daily.summary,
    "",
    `収集記事数: ${daily.articleCount}件`,
    "",
    "■ 注目記事",
    ...(articleLines.length > 0 ? articleLines : ["（なし）"]),
    "",
    "■ ダッシュボード",
    DASHBOARD_URL,
    "",
    "— 自動配信",
  ].join("\n");

  const articleHtml =
    topArticles.length === 0
      ? "<p>（なし）</p>"
      : `<ol>${topArticles
          .slice(0, 5)
          .map((a) => {
            const title = escapeHtml(a.title ?? "(無題)");
            const cat = a.category
              ? `<span style="color:#64748b">[${escapeHtml(a.category)}] </span>`
              : "";
            const link = a.url
              ? `<a href="${escapeHtml(a.url)}">${title}</a>`
              : title;
            return `<li style="margin-bottom:8px">${cat}${link}</li>`;
          })
          .join("")}</ol>`;

  const html = `
<!DOCTYPE html>
<html lang="ja">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px">
  <h1 style="font-size:18px;margin:0 0 16px">半導体インテリジェンス</h1>
  <p style="color:#64748b;margin:0 0 24px">${escapeHtml(dateLabel)} / 収集 ${daily.articleCount}件</p>

  <h2 style="font-size:15px;border-left:4px solid #34d399;padding-left:10px">今日のポイント</h2>
  <p style="white-space:pre-wrap;background:#f8fafc;padding:12px 14px;border-radius:8px">${escapeHtml(daily.summary)}</p>

  <h2 style="font-size:15px;border-left:4px solid #38bdf8;padding-left:10px">注目記事</h2>
  ${articleHtml}

  <p style="margin:28px 0 8px">
    <a href="${escapeHtml(DASHBOARD_URL)}"
       style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">
      ダッシュボードを開く
    </a>
  </p>
  <p style="font-size:12px;color:#94a3b8">${escapeHtml(DASHBOARD_URL)}</p>
</body>
</html>`.trim();

  const info = await sendMail({ subject, text, html });
  console.log("✅ 送信完了:", info.messageId);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("❌ 配信失敗:", e);
  await prisma.$disconnect();
  process.exit(1);
});
