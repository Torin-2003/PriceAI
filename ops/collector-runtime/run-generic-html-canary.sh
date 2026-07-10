#!/usr/bin/env bash
set -u

runtime_root="${PRICEAI_COLLECTOR_RUNTIME_ROOT:-$(cd "$(dirname "$0")" && pwd)}"
release_dir="${PRICEAI_COLLECTOR_RELEASE_DIR:-$runtime_root/current}"

cd "$release_dir"
set -a
source "$runtime_root/env"
set +a

export PRICEAI_COLLECTOR_NODE_TYPE="VPS"
export PRICEAI_COLLECTOR_NODE_RUNTIME="systemd"
export PRICEAI_COLLECTOR_NODE_REGION="cn"

status=0
export PRICEAI_COLLECTOR_NODE_ID="huoshan2-canary-gpt-pro20x"
export PRICEAI_COLLECTOR_NODE_NAME="Huoshan2 Canary GPT pro20x"
/usr/bin/node scripts/collect-prices.mjs --source gpt-pro20x --post --endpoint https://priceai.cc --silent || status=$?

export PRICEAI_COLLECTOR_NODE_ID="huoshan2-canary-lemon-watermelon"
export PRICEAI_COLLECTOR_NODE_NAME="Huoshan2 Canary Lemon Watermelon"
/usr/bin/node scripts/collect-prices.mjs --source "柠檬西瓜" --post --endpoint https://priceai.cc --silent || status=$?

exit "$status"
