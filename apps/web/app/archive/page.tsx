import { prisma } from "@/lib/db";
import SnapshotCard from "@/components/SnapshotCard";

export const revalidate = 3600;

async function getSnapshots() {
  return prisma.dailySnapshot.findMany({
    orderBy: { date: "desc" },
    take: 60, // 直近2ヶ月分
  });
}

export default async function ArchivePage() {
  const snapshots = await getSnapshots();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">アーカイブ</h1>
          <p className="text-sm text-slate-500 mt-1">
            過去のダッシュボード履歴（{snapshots.length}日分）
          </p>
        </div>
        <a
          href="/"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← ダッシュボードへ戻る
        </a>
      </div>

      {snapshots.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-500">
          <p className="text-lg mb-2">アーカイブがまだありません</p>
          <p className="text-sm">
            毎日21:00に自動生成されます。手動で実行するには：
          </p>
          <code className="mt-2 inline-block bg-slate-800 px-3 py-1 rounded text-sm text-slate-300">
            pnpm snapshot
          </code>
        </div>
      ) : (
        <div className="space-y-4">
          {snapshots.map((snapshot) => (
            <SnapshotCard key={snapshot.id} snapshot={snapshot} />
          ))}
        </div>
      )}
    </div>
  );
}
