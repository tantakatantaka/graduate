/**
 * ローカル表示用の社名匿名化（守秘）
 * next dev（NODE_ENV=development）でのみ有効。本番 Vercel では無効。
 *
 * 明示制御:
 *   ANONYMIZE_COMPANIES=true / NEXT_PUBLIC_ANONYMIZE_COMPANIES=true  → 強制ON
 *   ANONYMIZE_COMPANIES=false / NEXT_PUBLIC_ANONYMIZE_COMPANIES=false → 強制OFF
 */

const ALIAS_BY_TICKER: Record<string, string> = {
  AMAT: "A社",
  KIOXIA: "K社",
  MU: "M社",
  TSM: "T社",
  "SONY-SC": "S社",
  RAPIDUS: "R社",
};

/** 本文中の社名置換（長い表記から） */
const TEXT_REPLACEMENTS: { pattern: RegExp; alias: string }[] = [
  { pattern: /Applied\s*Materials/gi, alias: "A社" },
  { pattern: /アプライド(?:\s*マテリアルズ)?/g, alias: "A社" },
  { pattern: /\bAMAT\b/g, alias: "A社" },
  { pattern: /キオクシア/g, alias: "K社" },
  { pattern: /Kioxia/gi, alias: "K社" },
  { pattern: /\bKIOXIA\b/g, alias: "K社" },
  { pattern: /マイクロン(?:\s*テクノロジ[ーイ])?/g, alias: "M社" },
  { pattern: /Micron(?:\s*Technology)?/gi, alias: "M社" },
  { pattern: /\bMU\b/g, alias: "M社" },
  { pattern: /台湾積体電路製造/g, alias: "T社" },
  { pattern: /\bTSMC\b/g, alias: "T社" },
  { pattern: /\bTSM\b/g, alias: "T社" },
  {
    pattern: /ソニーセミコンダクター(?:ソリューションズ)?/g,
    alias: "S社",
  },
  { pattern: /Sony\s*Semiconductor(?:\s*Solutions)?/gi, alias: "S社" },
  { pattern: /ソニーセミコン/g, alias: "S社" },
  { pattern: /ラピダス/g, alias: "R社" },
  { pattern: /Rapidus/gi, alias: "R社" },
  { pattern: /\bRAPIDUS\b/g, alias: "R社" },
];

export function shouldAnonymizeCompanies(): boolean {
  const explicit =
    process.env.NEXT_PUBLIC_ANONYMIZE_COMPANIES ??
    process.env.ANONYMIZE_COMPANIES;
  if (explicit === "true") return true;
  if (explicit === "false") return false;
  return process.env.NODE_ENV === "development";
}

export function companyAlias(ticker: string): string | null {
  return ALIAS_BY_TICKER[ticker] ?? null;
}

export function displayCompanyName(
  ticker: string,
  name: string | null | undefined
): string {
  if (!shouldAnonymizeCompanies()) return name ?? ticker;
  return companyAlias(ticker) ?? name ?? ticker;
}

export function displayCompanyNameJa(
  ticker: string,
  nameJa: string | null | undefined
): string | null {
  if (!shouldAnonymizeCompanies()) return nameJa ?? null;
  // 匿名化時は name 側に別名を出すため、日本語名は出さない（重複防止）
  if (companyAlias(ticker)) return null;
  return nameJa ?? null;
}

export function displayTicker(ticker: string): string {
  if (!shouldAnonymizeCompanies()) return ticker;
  return companyAlias(ticker) ?? ticker;
}

export function anonymizeText(text: string | null | undefined): string {
  if (!text) return "";
  if (!shouldAnonymizeCompanies()) return text;
  let out = text;
  for (const { pattern, alias } of TEXT_REPLACEMENTS) {
    out = out.replace(pattern, alias);
  }
  return out;
}
