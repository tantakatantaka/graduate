#!/usr/bin/env bash
# apps/worker/.env から GitHub Actions Secrets を一括登録する
# 使い方: gh auth login のあと ./scripts/set-github-secrets.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/apps/worker/.env"
REPO="${GITHUB_REPO:-tantakatantaka/graduate}"

if ! command -v gh >/dev/null; then
  echo "gh が必要です: https://cli.github.com/"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "missing $ENV_FILE"
  exit 1
fi

KEYS=(
  DATABASE_URL
  DIRECT_URL
  ENABLE_AI
  OPENAI_API_KEY
  DEEPL_API_KEY
  GMAIL_USER
  GMAIL_APP_PASSWORD
  MAIL_TO
  MAIL_BCC
  DASHBOARD_URL
)

# shellcheck disable=SC1090
set -a
# .env を安全に読み込み（export）
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  val="${val%\"}"
  val="${val#\"}"
  val="${val%\'}"
  val="${val#\'}"
  export "$key=$val"
done < "$ENV_FILE"
set +a

for key in "${KEYS[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "skip $key (empty)"
    continue
  fi
  printf '%s' "${!key}" | gh secret set "$key" --repo "$REPO"
  echo "set $key"
done

echo "done"
