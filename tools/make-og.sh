#!/bin/sh
# Renders tools/og.html to icons/og.jpg (1200x630 link-preview image) with headless Chrome.
# JPEG keeps it well under WhatsApp's ~300 KB preview-image limit.
set -eu
cd "$(dirname "$0")/.."
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
TMP=$(mktemp -d)
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$TMP" \
  --window-size=1200,630 --force-device-scale-factor=1 \
  --screenshot="$TMP/og.png" "file://$PWD/tools/og.html"
sips -s format jpeg -s formatOptions 85 "$TMP/og.png" --out icons/og.jpg >/dev/null
rm -rf "$TMP"
ls -l icons/og.jpg
