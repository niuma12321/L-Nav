#!/usr/bin/env bash

set -euo pipefail

branch="$(git branch --show-current)"

if [[ -z "${branch}" ]]; then
  echo "No current branch detected."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  message="${1:-chore: sync changes $(date '+%Y-%m-%d %H:%M:%S')}"
  git add -A
  git commit -m "${message}"
  git push origin "${branch}"
  echo "Pushed changes to ${branch}."
else
  echo "No changes to commit."
fi
