#!/usr/bin/env bash
# Give a bench site a real, publicly-resolvable URL with zero client-side
# config, using nip.io's free wildcard DNS (<anything>.<ip-with-dashes>.nip.io
# resolves straight to that IP). Works from any device, no hosts-file edits.
#
# This is an interim measure for the pilot/demo phase — once a real domain
# exists, point actual subdomains at client sites instead. The underlying
# mechanism (a symlink under sites/ pointing at the real site folder) is
# the same either way, so nothing here needs to be undone later.
#
# Run this ON THE SERVER, inside the bench container (e.g. via
# `docker exec -u root <backend-container> bash` first, or paste as a
# one-liner over SSH+docker exec).
#
# Usage: add-nip-io-alias.sh <sitename> <server-ip>
# Example: add-nip-io-alias.sh gym-demo 62.238.22.161

set -euo pipefail

SITE="${1:?Usage: add-nip-io-alias.sh <sitename> <server-ip>}"
IP="${2:?Usage: add-nip-io-alias.sh <sitename> <server-ip>}"
IP_DASHED="${IP//./-}"
ALIAS="${SITE}.${IP_DASHED}.nip.io"
BENCH_SITES="/home/frappe/frappe-bench/sites"

if [ ! -d "${BENCH_SITES}/${SITE}" ]; then
  echo "error: site '${SITE}' does not exist under ${BENCH_SITES}" >&2
  exit 1
fi

ln -sfn "${BENCH_SITES}/${SITE}" "${BENCH_SITES}/${ALIAS}"

echo "Alias created. Open in any browser, no config needed:"
echo "  http://${ALIAS}:8080"
