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

# RSS収集を手動実行（動作確認）
cd apps/worker && pnpm collect
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
