# 半導体インテリジェンス

半導体業界の特定企業情報・業界ニュースを自動収集・AI要約してチームで閲覧するダッシュボード。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 15 (App Router) + Tailwind CSS |
| バックエンド / Worker | Node.js + TypeScript + node-cron |
| AI | OpenAI API (GPT-4o mini) |
| DB | Neon (PostgreSQL) + Prisma |
| デプロイ | Vercel (web) + Railway/Render (worker) |

## セットアップ

### 1. 依存関係インストール

```bash
pnpm install
```

### 2. 環境変数設定

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/worker/.env
# 各ファイルにNeon・OpenAI APIキーを設定
```

### 3. DBスキーマ適用

```bash
pnpm db:push
```

### 4. 開発サーバー起動

```bash
# フロントエンドのみ
cd apps/web && pnpm dev

# RSS収集を手動実行（AI要約込み）
cd apps/worker && pnpm collect

# 既存記事へのAI要約バックフィル（任意）
cd apps/worker && pnpm ai-backfill
```

### AI要約の動作

`ENABLE_AI=true`（デフォルト）のとき worker が次を実行します。

| タイミング | 内容 |
|-----------|------|
| 収集時（月〜金 5:00） | 企業マッチ／半導体関連記事の要約・カテゴリ・重要度 |
| スナップショット（月〜金 6:15） | 「今日のポイント」日次サマリー |
| メール配信（月〜金 6:30） | Gmailで要約＋ダッシュボードURLを送信（土日なし） |
| 週次（月曜9:00） | 「先週の動向」週次サマリー |

オフにする場合は `apps/worker/.env` で `ENABLE_AI=false` にしてください。

### 定時実行（GitHub Actions・PC不要）

平日の収集〜メール配信は **GitHub Actions**（`.github/workflows/daily-worker.yml`）で実行します。**土日は配信しません。**

| 日本時間 | 内容 |
|---------|------|
| 月〜金 早朝〜朝 | collect → … → notify（GitHub遅延対策で複数枠。午前10時以降のメールは送らない） |
| 月曜 9:00 | 週次サマリー |
| 土・日 | 配信なし |

リポジトリの **Settings → Secrets and variables → Actions** に次を登録してください。

`DATABASE_URL` / `DIRECT_URL` / `ENABLE_AI` / `OPENAI_API_KEY` / `DEEPL_API_KEY` / `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `MAIL_TO` / `MAIL_BCC` / `DASHBOARD_URL`

手動実行: Actions タブ → **Daily worker pipeline** → Run workflow

ローカル worker は不要です（止めて問題ありません）。

### Gmail 日次配信

1. Googleアカウントで [2段階認証](https://myaccount.google.com/security) を有効化
2. [アプリパスワード](https://myaccount.google.com/apppasswords) を発行（メール用）
3. `apps/worker/.env` に設定:

```bash
GMAIL_USER="your.name@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
MAIL_TO="recipient@example.com"   # 複数はカンマ区切り
MAIL_BCC="bcc@example.com"        # 任意・複数はカンマ区切り
DASHBOARD_URL="https://semiconductor-intelligence.vercel.app"
```

4. テスト送信:

```bash
cd apps/worker && pnpm notify
```

## ディレクトリ構成

```
apps/
  web/      # Next.js ダッシュボード
  worker/   # RSS収集・AI要約・cronジョブ
packages/
  db/       # Prismaスキーマ（共有）
```

## 追跡対象企業

TSMC / NVIDIA / Intel / Samsung / ASML / Micron / Qualcomm / AMD
