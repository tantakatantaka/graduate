import type { Metadata } from "next";
import "./globals.css";
import "./section-tones.css";

export const metadata: Metadata = {
  title: "半導体インテリジェンス",
  description: "半導体業界の企業情報・業界ニュースをリアルタイムで追跡",
};

/** HTMLに直接埋め込み — CSSチャンクキャッシュに依存しない */
const TONE_CSS = `
.section-panel{border-radius:1rem!important;border-style:solid!important;border-width:2px!important;padding:1rem!important}
@media(min-width:768px){.section-panel{padding:1.25rem!important}}
.section-panel__title{display:flex!important;align-items:center!important;gap:.5rem!important;font-size:.875rem!important;font-weight:600!important;margin-bottom:.75rem!important}
.section-panel__bar{display:inline-block!important;width:.375rem!important;height:1rem!important;border-radius:9999px!important;flex-shrink:0!important}
.tone-daily{border-color:#34d399!important;background-color:rgba(16,185,129,.22)!important}
.tone-daily-title,.tone-daily-meta,.tone-daily-btn{color:#6ee7b7!important}
.tone-daily-bar{background-color:#34d399!important}
.tone-weekly{border-color:#818cf8!important;background-color:rgba(99,102,241,.2)!important}
.tone-weekly-title,.tone-weekly-meta,.tone-weekly-btn{color:#a5b4fc!important}
.tone-weekly-bar{background-color:#818cf8!important}
.tone-customer{border-color:#2dd4bf!important;background-color:rgba(20,184,166,.2)!important}
.tone-customer-title{color:#5eead4!important}
.tone-customer-bar{background-color:#2dd4bf!important}
.card-customer{border:2px solid rgba(45,212,191,.75)!important;background-color:rgba(45,212,191,.16)!important;border-radius:.75rem!important}
.badge-customer{background-color:rgba(45,212,191,.25)!important;color:#99f6e4!important;border:1px solid rgba(94,234,212,.6)!important}
.link-customer{color:#5eead4!important}
.divider-customer{border-color:rgba(45,212,191,.35)!important}
.tone-news{border-color:#38bdf8!important;background-color:rgba(14,165,233,.2)!important}
.tone-news-title,.tone-news-meta{color:#7dd3fc!important}
.tone-news-bar{background-color:#38bdf8!important}
.card-news{border:1px solid rgba(56,189,248,.6)!important;background-color:rgba(56,189,248,.14)!important;border-radius:.5rem!important}
.chip-news{background-color:rgba(7,89,133,.65)!important;color:#e0f2fe!important;border:1px solid rgba(56,189,248,.45)!important}
.tone-enduser{border-color:#fbbf24!important;background-color:rgba(245,158,11,.18)!important}
.tone-enduser-title{color:#fcd34d!important}
.tone-enduser-bar{background-color:#fbbf24!important}
.card-enduser{border:2px solid rgba(251,191,36,.7)!important;background-color:rgba(251,191,36,.14)!important;border-radius:.75rem!important}
.link-enduser{color:#fcd34d!important}
.divider-enduser{border-color:rgba(251,191,36,.35)!important}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: TONE_CSS }} />
      </head>
      <body className="min-h-screen text-dash-text antialiased">
        <header className="border-b border-dash-border/80 bg-[#070b14]/75 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#070b14] font-bold text-sm bg-[#2dd4bf]">
              半
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              半導体インテリジェンス
            </h1>
            <nav className="ml-auto flex items-center gap-4">
              <a
                href="/"
                className="text-sm text-dash-muted hover:text-dash-accent transition-colors"
              >
                ダッシュボード
              </a>
              <a
                href="/archive"
                className="text-sm text-dash-muted hover:text-dash-accent transition-colors"
              >
                バックナンバー
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
