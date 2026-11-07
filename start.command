#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
echo 'Qingheng character: http://127.0.0.1:8765/character.html'
echo 'Yunqi Demo: http://127.0.0.1:8765/'
echo 'Open a URL in Chrome. Keep this terminal open; Ctrl+C stops the server.'
if command -v node >/dev/null 2>&1; then
  exec node tools/serve.mjs
elif command -v python3 >/dev/null 2>&1 && python3 -c 'import http.server' >/dev/null 2>&1; then
  exec python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
elif /usr/bin/python3 -c 'import http.server' >/dev/null 2>&1; then
  exec /usr/bin/python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
else
  echo 'Node.js or a working Python 3 installation is required.'
  read -r '?Press Enter to close...'
  exit 1
fi
