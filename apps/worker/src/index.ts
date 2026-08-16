import "./lib/load-env.js";
import cron from "node-cron";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const TZ = "Asia/Tokyo";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tsx = path.join(root, "node_modules/.bin/tsx");

const JOBS: Record<string, string> = {
  collect: "src/jobs/collect.ts",
  translate: "src/jobs/translate.ts",
  stock: "src/jobs/stock.ts",
  snapshot: "src/jobs/snapshot.ts",
  notify: "src/jobs/notify.ts",
  summarize: "src/jobs/summarize.ts",
};

function run(label: string, job: keyof typeof JOBS) {
  console.log(`⏰ ${label} — ${new Date().toLocaleString("ja-JP", { timeZone: TZ })}`);
  execSync(`"${tsx}" ${JOBS[job]}`, {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
}

function requireEnv(keys: string[]) {
  const missing = keys.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    console.warn("⚠️ 未設定の環境変数:", missing.join(", "));
  } else {
    console.log("✅ 配信・DB系の環境変数を確認");
  }
}

console.log("🤖 Worker 起動:", new Date().toLocaleString("ja-JP", { timeZone: TZ }));
requireEnv([
  "DATABASE_URL",
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  "MAIL_TO",
  "DASHBOARD_URL",
]);
console.log(`🤖 AI要約: ${process.env.ENABLE_AI === "true" ? "ON" : "OFF"}`);

// 毎日 5:00 にRSS収集
cron.schedule("0 5 * * *", () => run("RSS収集ジョブ実行", "collect"), { timezone: TZ });

// 毎日 5:30 に上位記事をDeepLで日本語翻訳
cron.schedule("30 5 * * *", () => run("日本語翻訳ジョブ実行", "translate"), {
  timezone: TZ,
});

// 毎日 6:00 に株価取得（米市場終値反映は翌日朝）
cron.schedule("0 6 * * *", () => run("株価取得ジョブ実行", "stock"), { timezone: TZ });

// 毎日 6:15 に日次スナップショット生成
cron.schedule("15 6 * * *", () => run("日次スナップショット生成ジョブ実行", "snapshot"), {
  timezone: TZ,
});

// 毎日 6:30 にGmailで日次配信
cron.schedule("30 6 * * *", () => run("日次メール配信ジョブ実行", "notify"), {
  timezone: TZ,
});

// 毎週月曜 9:00 に週次サマリー生成
cron.schedule("0 9 * * 1", () => run("週次サマリー生成ジョブ実行", "summarize"), {
  timezone: TZ,
});

console.log("⏳ スケジュール登録完了（Asia/Tokyo）。明日から定時実行します。");
console.log("   5:00 collect → 5:30 translate → 6:00 stock → 6:15 snapshot → 6:30 notify");
console.log("   ※ このPCの電源と worker プロセスを朝まで維持してください");
