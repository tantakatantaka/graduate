import "dotenv/config";
import cron from "node-cron";
import { execSync } from "child_process";

console.log("🤖 Worker 起動:", new Date().toLocaleString("ja-JP"));

// 毎日 5:00 にRSS収集
cron.schedule("0 5 * * *", () => {
  console.log("⏰ RSS収集ジョブ実行");
  execSync("pnpm collect", { stdio: "inherit" });
});

// 毎日 5:30 に上位記事をDeepLで日本語翻訳
cron.schedule("30 5 * * *", () => {
  console.log("⏰ 日本語翻訳ジョブ実行");
  execSync("pnpm translate", { stdio: "inherit" });
});

// 毎日 6:00 に株価取得（米市場終値反映は翌日朝）
cron.schedule("0 6 * * *", () => {
  console.log("⏰ 株価取得ジョブ実行");
  execSync("pnpm stock", { stdio: "inherit" });
});

// 毎日 6:15 に日次スナップショット生成
cron.schedule("15 6 * * *", () => {
  console.log("⏰ 日次スナップショット生成ジョブ実行");
  execSync("pnpm snapshot", { stdio: "inherit" });
});

// 毎週月曜 9:00 に週次サマリー生成
cron.schedule("0 9 * * 1", () => {
  console.log("⏰ 週次サマリー生成ジョブ実行");
  execSync("pnpm summarize", { stdio: "inherit" });
});

console.log("⏳ スケジュール登録完了。ジョブ待機中...");
