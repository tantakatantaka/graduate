import { prisma } from "@/lib/db";
import CompanyCard from "@/components/CompanyCard";
import ArticleFeed from "@/components/ArticleFeed";
import WeeklySummaryBanner from "@/components/WeeklySummaryBanner";
import { rankArticles } from "@/lib/rank-articles";

export const dynamic = "force-dynamic"; // 翻訳反映をすぐ見るため常時最新取得

const FEED_LIMIT = 10;

/** エンドユーザー表示順 */
const ENDUSER_ORDER = ["KIOXIA", "MU", "TSM", "SONY-SC", "RAPIDUS"] as const;

async function getCompanies() {
  return prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      articles: {
        include: { article: true },
        orderBy: { article: { publishedAt: "desc" } },
        take: 5,
      },
      stockData: {
        orderBy: { date: "desc" },
        take: 2,
      },
    },
  });
}

async function getLatestSummary() {
  return prisma.weeklySummary.findFirst({ orderBy: { weekOf: "desc" } });
}

async function getLatestDailySnapshot() {
  return prisma.dailySnapshot.findFirst({
    orderBy: { date: "desc" },
    select: { summary: true, date: true, articleCount: true },
  });
}

/** 直近候補からルールベースで上位10件に絞る */
async function getTopIndustryArticles() {
  const candidates = await prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    take: 100,
    include: {
      companies: {
        include: { company: { select: { name: true, ticker: true } } },
      },
    },
  });

  const mapped = candidates.map((a) => ({
    ...a,
    companies: a.companies.map((ac) => ac.company),
  }));

  return rankArticles(mapped, FEED_LIMIT);
}

export default async function DashboardPage() {
  const [companies, summary, dailySnapshot, articles] = await Promise.all([
    getCompanies(),
    getLatestSummary(),
    getLatestDailySnapshot(),
    getTopIndustryArticles(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <a
          href="/archive"
          className="text-sm text-dash-accent hover:text-dash-accent-soft transition-colors"
        >
          バックナンバーを見る →
        </a>
      </div>

      {/* 日次＋週次AIサマリー */}
      {(dailySnapshot || summary) && (
        <WeeklySummaryBanner daily={dailySnapshot} weekly={summary} />
      )}

      {(() => {
        const main = companies.filter((c) => c.role === "main");
        const subs = companies
          .filter((c) => c.role !== "main")
          .sort((a, b) => {
            const ai = ENDUSER_ORDER.indexOf(
              a.ticker as (typeof ENDUSER_ORDER)[number]
            );
            const bi = ENDUSER_ORDER.indexOf(
              b.ticker as (typeof ENDUSER_ORDER)[number]
            );
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
          });
        return (
          <>
            {/* ① 顧客情報 — ティール */}
            {main.length > 0 && (
              <section className="section-panel tone-customer">
                <h2 className="section-panel__title tone-customer-title mb-3">
                  <span className="section-panel__bar tone-customer-bar" />
                  顧客情報
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {main.map((company) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      isMain
                      tone="customer"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ② 業界ニュース — スカイ */}
            <section className="section-panel tone-news">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="section-panel__title tone-news-title mb-0">
                  <span className="section-panel__bar tone-news-bar" />
                  業界ニュース
                </h2>
                <span className="text-xs tone-news-meta">
                  優先度上位 {articles.length} 件
                </span>
              </div>
              <ArticleFeed articles={articles} />
            </section>

            {/* ③ エンドユーザー — アンバー */}
            <section className="section-panel tone-enduser">
              <h2 className="section-panel__title tone-enduser-title mb-3">
                <span className="section-panel__bar tone-enduser-bar" />
                エンドユーザー情報
              </h2>
              {subs.length === 0 ? (
                <div className="rounded-xl border border-dash-border bg-dash-surface/60 p-8 text-center text-dash-dim">
                  <p className="text-lg mb-2">企業データがありません</p>
                  <p className="text-sm">
                    <code className="bg-dash-panel px-2 py-1 rounded border border-dash-border">
                      pnpm collect
                    </code>{" "}
                    を実行してデータを収集してください
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subs.map((company) => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      tone="enduser"
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        );
      })()}
    </div>
  );
}
