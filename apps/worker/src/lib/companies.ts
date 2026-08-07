// 追跡対象の半導体企業マスターデータ
export const COMPANIES = [
  {
    name: "TSMC",
    nameJa: "台湾積体電路製造",
    ticker: "TSM",
    keywords: ["TSMC", "TSM", "台湾積体電路", "台積電"],
    description: "世界最大の半導体受託製造企業",
  },
  {
    name: "NVIDIA",
    nameJa: "エヌビディア",
    ticker: "NVDA",
    keywords: ["NVIDIA", "NVDA", "エヌビディア", "Nvidia"],
    description: "GPU・AI半導体の世界最大手",
  },
  {
    name: "Intel",
    nameJa: "インテル",
    ticker: "INTC",
    keywords: ["Intel", "INTC", "インテル"],
    description: "米国最大の半導体メーカー",
  },
  {
    name: "Samsung",
    nameJa: "サムスン電子",
    ticker: "SSNLF",
    keywords: ["Samsung", "サムスン", "Samsung Electronics", "三星"],
    description: "韓国最大の半導体・電子機器メーカー",
  },
  {
    name: "ASML",
    nameJa: "ASML",
    ticker: "ASML",
    keywords: ["ASML", "EUV"],
    description: "半導体露光装置の世界独占メーカー",
  },
  {
    name: "Micron",
    nameJa: "マイクロン",
    ticker: "MU",
    keywords: ["Micron", "MU", "マイクロン"],
    description: "メモリ半導体（DRAM/NAND）大手",
  },
  {
    name: "Qualcomm",
    nameJa: "クアルコム",
    ticker: "QCOM",
    keywords: ["Qualcomm", "QCOM", "クアルコム"],
    description: "モバイル向けSoC・通信半導体大手",
  },
  {
    name: "AMD",
    nameJa: "AMD",
    ticker: "AMD",
    keywords: ["AMD", "Advanced Micro Devices", "エーエムディー"],
    description: "CPU・GPU設計専業（ファブレス）",
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
