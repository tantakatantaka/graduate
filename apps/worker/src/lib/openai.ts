import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ArticleSummary = {
  summary: string;        // 100字程度の日本語要約
  category: string;       // 決算 / 技術 / 規制 / M&A / その他
  importance: "high" | "medium" | "low";
};

// 記事タイトル＋冒頭テキストをAIで要約・分類する
export async function summarizeArticle(
  title: string,
  text: string
): Promise<ArticleSummary> {
  const truncated = text.slice(0, 500); // コスト削減のため先頭500文字のみ

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `あなたは半導体業界のニュースアナリストです。
以下の記事を読んで、JSON形式で返答してください。

フォーマット:
{
  "summary": "100字以内の日本語要約",
  "category": "決算 / 技術 / 規制 / M&A / その他 のいずれか",
  "importance": "high（業界全体に影響）/ medium（特定企業に影響）/ low（参考情報）のいずれか"
}`,
      },
      {
        role: "user",
        content: `タイトル: ${title}\n\n本文（抜粋）: ${truncated}`,
      },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content) as ArticleSummary;
  return parsed;
}

// 週次サマリーを生成する
export async function generateWeeklySummary(
  articles: { title: string; summary: string; category: string }[]
): Promise<string> {
  const articleList = articles
    .map((a, i) => `${i + 1}. [${a.category}] ${a.title}\n   ${a.summary}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "あなたは半導体業界の専門アナリストです。先週の半導体業界ニュースを、投資家・営業担当者向けに400字程度で簡潔にまとめてください。重要トレンドを3点に絞って箇条書きで示してください。",
      },
      {
        role: "user",
        content: `先週の記事一覧:\n\n${articleList}`,
      },
    ],
  });

  return response.choices[0].message.content ?? "";
}
