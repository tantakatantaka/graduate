// 半導体業界関連のRSSフィード一覧
export const RSS_SOURCES = [
  {
    name: "EE Times",
    url: "https://www.eetimes.com/feed/",
    lang: "en",
  },
  {
    name: "EE Times Japan",
    url: "https://rss.itmedia.co.jp/rss/2.0/eetimes.xml",
    lang: "ja",
  },
  {
    name: "SemiEngineering",
    url: "https://semiengineering.com/feed/",
    lang: "en",
  },
  {
    name: "DIGITIMES",
    url: "https://www.digitimes.com/rss/daily.xml",
    lang: "en",
  },
  {
    name: "Semiconductor Digest",
    url: "https://www.semiconductor-digest.com/feed/",
    lang: "en",
  },
  {
    name: "TrendForce",
    // メモリ／装置など業界ニュース（公式RSS）
    url: "https://www.trendforce.com/news/feed_v2/",
    lang: "en",
  },
  {
    name: "DRAMeXchange",
    // TrendForce傘下。DXI（DRAMスポット）日次コメント＋メモリ需給レポート
    // ※詳細スポット価格表自体は有料会員向け
    url: "https://www.dramexchange.com/WeeklyResearch/RSS",
    lang: "en",
  },
  {
    name: "SEMI News",
    // SEMI Market Intelligence 本体（EMDS等）は有料・RSSなし。
    // 公開される装置 billings / fab forecast のプレス報道を Google News 経由で収集。
    url: "https://news.google.com/rss/search?q=%22SEMI%20Reports%22%20OR%20%22SEMI%20forecasts%22%20OR%20WWSEMS%20semiconductor%20equipment&hl=en-US&gl=US&ceid=US:en",
    lang: "en",
  },
  {
    name: "SEAJ News",
    // 公式RSSなし → 日本製装置の月次販売高報道を Google News 経由で収集
    url: "https://news.google.com/rss/search?q=SEAJ%20OR%20%E6%97%A5%E6%9C%AC%E5%8D%8A%E5%B0%8E%E4%BD%93%E8%A3%BD%E9%80%A0%E8%A3%85%E7%BD%AE%E5%8D%94%E4%BC%9A%20%E8%B2%A9%E5%A3%B2%E9%AB%98&hl=ja&gl=JP&ceid=JP:ja",
    lang: "ja",
  },
  {
    name: "PC Watch",
    url: "https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf",
    lang: "ja",
  },
  {
    name: "日経ビジネス",
    url: "https://business.nikkei.com/rss/sns/nb.rdf",
    lang: "ja",
  },
] as const;
