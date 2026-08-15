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
| 収集時（毎日5:00） | 企業マッチ／半導体関連記事の要約・カテゴリ・重要度 |
| スナップショット（毎日6:15） | 「今日のポイント」日次サマリー |
| 週次（月曜9:00） | 「先週の動向」週次サマリー |

オフにする場合は `apps/worker/.env` で `ENABLE_AI=false` にしてください。

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
