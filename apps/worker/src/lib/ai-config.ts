import "dotenv/config";

/** OpenAI 要約・分類を実行するか（apps/worker/.env の ENABLE_AI） */
export function isAiEnabled(): boolean {
  return process.env.ENABLE_AI === "true";
}

/** 企業マッチがなくてもAI要約する半導体関連判定 */
export function isSemiconductorRelevant(text: string): boolean {
  return /(半導体|semiconductor|hbm|euv|foundry|fab|wafer|nand|dram|チップ|chip\b|tsmc|applied\s*materials|micron|kioxia|rapidus)/i.test(
    text
  );
}
