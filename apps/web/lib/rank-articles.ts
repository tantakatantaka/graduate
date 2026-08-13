/** 業界ニュースの優先度スコアリング（ルールベース） */

const MAIN_TICKERS = new Set(["AMAT"]);

const PRIORITY_KEYWORDS: { pattern: RegExp; score: number }[] = [
  { pattern: /\b(euv|hbm|hbm3|hbm4|2nm|3nm|gaa|cvd|ald|ale)\b/i, score: 20 },
  { pattern: /(決算|earnings|revenue|ガイダンス)/i, score: 18 },
  { pattern: /(工場|fab|foundry|量産|着工|補助金|規制|export\s*control)/i, score: 16 },
  { pattern: /(合併|買収|m&a|出資|提携)/i, score: 14 },
  { pattern: /(半導体|semiconductor|chip|wafer|nand|dram)/i, score: 10 },
];

const SOURCE_SCORE: Record<string, number> = {
  "EE Times": 12,
  "EE Times Japan": 14,
  SemiEngineering: 12,
  日経ビジネス: 10,
  "Tom's Hardware": 2,
};

export type RankableArticle = {
  title: string;
  publishedAt: Date;
  source: string;
  importance: string | null;
  companies: { ticker: string; name: string }[];
};

/**
 * スコア内訳:
 * - 顧客企業(AMAT)マッチ: +100
 * - エンドユーザー企業マッチ: +40 × 社数（上限120）
 * - 重要キーワード: 各 +10〜20
 * - 鮮度: 最大 +30（本日）〜 0（14日超）
 * - ソース信頼度: +2〜14
 * - importance(high/medium): +20 / +8（AI利用時）
 */
export function scoreArticle(article: RankableArticle): number {
  let score = 0;
  const tickers = article.companies.map((c) => c.ticker);
  const text = article.title;

  if (tickers.some((t) => MAIN_TICKERS.has(t))) {
    score += 100;
  }

  const subHits = tickers.filter((t) => !MAIN_TICKERS.has(t)).length;
  score += Math.min(subHits * 40, 120);

  for (const { pattern, score: kwScore } of PRIORITY_KEYWORDS) {
    if (pattern.test(text)) score += kwScore;
  }

  const ageMs = Date.now() - new Date(article.publishedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 1) score += 30;
  else if (ageDays <= 3) score += 20;
  else if (ageDays <= 7) score += 10;
  else if (ageDays <= 14) score += 4;

  score += SOURCE_SCORE[article.source] ?? 4;

  if (article.importance === "high") score += 20;
  else if (article.importance === "medium") score += 8;

  return score;
}

/** スコア降順で並べ、上位 limit 件を返す（最低スコア未満は除外） */
export function rankArticles<T extends RankableArticle>(
  articles: T[],
  limit = 10,
  minScore = 20
): T[] {
  return [...articles]
    .map((a) => ({ article: a, score: scoreArticle(a) }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(b.article.publishedAt).getTime() -
        new Date(a.article.publishedAt).getTime()
      );
    })
    .slice(0, limit)
    .map(({ article }) => article);
}
