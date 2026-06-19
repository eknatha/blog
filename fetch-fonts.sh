#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# One-time font fetch for complete offline rendering.
# Run this ONCE on your machine (it has unrestricted network).
# Downloads the woff2 files into assets/fonts/ and writes fonts.css.
# After running, commit assets/fonts/ — the blog renders pixel-identical
# offline, from file://, with no Google Fonts request ever.
# ──────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p assets/fonts
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
URL="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"

echo "→ fetching Google Fonts CSS…"
curl -sL -A "$UA" "$URL" -o assets/fonts/_remote.css

echo "→ downloading woff2 files & rewriting URLs to local paths…"
# Extract each remote woff2 URL, download it, and rewrite the CSS to point local.
python3 - <<'PY'
import re, urllib.request, pathlib, hashlib
css = pathlib.Path("assets/fonts/_remote.css").read_text()
ua = {"User-Agent":"Mozilla/5.0"}
def grab(url):
    name = hashlib.md5(url.encode()).hexdigest()[:8] + ".woff2"
    out = pathlib.Path("assets/fonts")/name
    if not out.exists():
        req = urllib.request.Request(url, headers=ua)
        out.write_bytes(urllib.request.urlopen(req).read())
        print("  ✓", name, f"({out.stat().st_size//1024}KB)")
    return name
def repl(m):
    return "url('"+grab(m.group(1))+"')"
css = re.sub(r"url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)", repl, css)
pathlib.Path("assets/fonts/fonts.css").write_text(css)
pathlib.Path("assets/fonts/_remote.css").unlink()
print("→ wrote assets/fonts/fonts.css")
PY

echo ""
echo "Done. Now run:  node build.js"
echo "Then commit assets/fonts/ for fully offline, pixel-identical rendering."
