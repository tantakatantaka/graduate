import { prisma } from "@/lib/db";
import CompanyCard from "@/components/CompanyCard";
import ArticleFeed from "@/components/ArticleFeed";
import WeeklySummaryBanner from "@/components/WeeklySummaryBanner";

export const revalidate = 3600; // 1時間キャッシュ

async function getCompanies() {
  return prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      articles: {
        include: { article: true },
        orderBy: { article: { publishedAt: "desc" } },
        take: 3,
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

async function getLatestArticles() {
  return prisma.article.findMany({
    orderBy: { publishedAt: "desc" },
    take: 20,
    include: {
      companies: {
        include: { company: { select: { name: true, ticker: true } } },
      },
    },
  });
}

export default async function DashboardPage() {
  const [companies, summary, articles] = await Promise.all([
    getCompanies(),
    getLatestSummary(),
    getLatestArticles(),
  ]);

  return (
    <div className="space-y-8">
      {/* 週次AIサマリー */}
      {summary && <WeeklySummaryBanner summary={summary} />}

      {/* 企業カードグリッド */}
      <section>
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">
          追跡企業
        </h2>
        {companies.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-500">
            <p className="text-lg mb-2">企業データがありません</p>
            <p className="text-sm">
              <code className="bg-slate-800 px-2 py-1 rounded">
                pnpm collect
              </code>{" "}
              を実行してデータを収集してください
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </section>

      {/* 業界全体フィード */}
      <section>
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">
          業界ニュースフィード
        </h2>
        <ArticleFeed
          articles={articles.map((a) => ({
            ...a,
            companies: a.companies.map((ac) => ac.company),
          }))}
        />
      </section>
    </div>
  );
}
