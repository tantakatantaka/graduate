import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "半導体インテリジェンス",
  description: "半導体業界の企業情報・業界ニュースをリアルタイムで追跡",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              半
            </div>
            <h1 className="text-lg font-semibold text-white">
              半導体インテリジェンス
            </h1>
            <span className="text-slate-500 text-sm ml-auto">
              業界情報ダッシュボード
            </span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
