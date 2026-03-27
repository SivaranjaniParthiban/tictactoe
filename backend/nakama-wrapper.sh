#!/bin/sh
set -eu

# If Railway (or another platform) overrides the command to plain `nakama`,
# route startup through our entrypoint so DB env resolution + migrations still run.
if [ "$#" -eq 0 ]; then
  exec /nakama/entrypoint.sh
fi

case "$1" in
  --*|server)
    exec /nakama/entrypoint.sh
    ;;
  *)
    exec /nakama/nakama "$@"
    ;;
esac
