// 追跡対象の半導体企業マスターデータ
// role: "main" = メイン企業（Applied Materials）、"sub" = サブ企業
export const COMPANIES = [
  {
    name: "Applied Materials",
    nameJa: "アプライドマテリアルズ",
    ticker: "AMAT",
    role: "main" as const,
    keywords: [
      "Applied Materials",
      "AMAT",
      "アプライドマテリアルズ",
      "アプライド マテリアルズ",
      "Applied Material",
    ],
    description: "半導体製造装置・材料の世界最大手",
  },
  {
    name: "TSMC",
    nameJa: "台湾積体電路製造",
    ticker: "TSM",
    role: "sub" as const,
    keywords: ["TSMC", "TSM", "台湾積体電路", "台積電"],
    description: "世界最大の半導体受託製造企業",
  },
  {
    name: "Kioxia",
    nameJa: "キオクシア",
    ticker: "KIOXIA",
    role: "sub" as const,
    keywords: ["Kioxia", "キオクシア", "KIOXIA", "旧東芝メモリ"],
    description: "NANDフラッシュメモリ大手（旧東芝メモリ）",
  },
  {
    name: "Rapidus",
    nameJa: "ラピダス",
    ticker: "RAPIDUS",
    role: "sub" as const,
    keywords: ["Rapidus", "ラピダス", "ラピダス株式会社"],
    description: "日本の次世代半導体製造を担う新興ファウンドリ",
  },
  {
    name: "Micron",
    nameJa: "マイクロン",
    ticker: "MU",
    role: "sub" as const,
    keywords: ["Micron", "MU", "マイクロン", "Micron Technology"],
    description: "メモリ半導体（DRAM/NAND）大手",
  },
  {
    name: "Sony Semiconductor",
    nameJa: "ソニーセミコンダクター",
    ticker: "SONY-SC",
    role: "sub" as const,
    keywords: [
      "Sony Semiconductor",
      "ソニーセミコンダクター",
      "ソニーセミコン",
      "Sony Semiconductor Solutions",
      "SSS",
    ],
    description: "CMOSイメージセンサー世界シェアトップ（ソニーグループ）",
  },
] as const;

export type CompanyData = (typeof COMPANIES)[number];

// キーワードが記事タイトル・本文にマッチする企業を返す
export function matchCompanies(text: string): string[] {
  const matched: string[] = [];
  for (const company of COMPANIES) {
    const isMatch = company.keywords.some((kw) =>
      text.toLowerCase().includes(kw.toLowerCase())
    );
    if (isMatch) {
      matched.push(company.ticker);
    }
  }
  return matched;
}
