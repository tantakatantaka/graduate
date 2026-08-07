import "dotenv/config";
import cron from "node-cron";
import { execSync } from "child_process";

console.log("🤖 Worker 起動:", new Date().toLocaleString("ja-JP"));

// 毎日 8:00 と 20:00 にRSS収集
cron.schedule("0 8,20 * * *", () => {
  console.log("⏰ RSS収集ジョブ実行");
  execSync("pnpm collect", { stdio: "inherit" });
});

// 毎週月曜 9:00 に週次サマリー生成
cron.schedule("0 9 * * 1", () => {
  console.log("⏰ 週次サマリー生成ジョブ実行");
  execSync("pnpm summarize", { stdio: "inherit" });
});

console.log("⏳ スケジュール登録完了。ジョブ待機中...");
