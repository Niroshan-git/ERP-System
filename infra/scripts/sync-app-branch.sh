#!/usr/bin/env bash
# Export apps/<app_name>/ from the current branch onto a same-named branch
# whose root IS that app's root, via git subtree split. This is what makes
# `bench get-app <this-repo-url> --branch <app_name>` work without giving
# the app its own repository. See README.md's "App branches" section.
#
# Usage: infra/scripts/sync-app-branch.sh <app_name>
# Example: infra/scripts/sync-app-branch.sh smart_factory

set -euo pipefail

app_name="${1:?Usage: sync-app-branch.sh <app_name>}"
prefix="apps/${app_name}"
split_branch="_split/${app_name}"

if [ ! -d "${prefix}" ]; then
  echo "error: ${prefix} does not exist" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "error: working tree has uncommitted changes — commit or stash first" >&2
  exit 1
fi

git branch -D "${split_branch}" >/dev/null 2>&1 || true

echo "Splitting ${prefix} into a temporary branch..."
git subtree split --prefix="${prefix}" -b "${split_branch}"

echo "Pushing ${split_branch} -> origin/${app_name} (force)..."
git push origin "${split_branch}:${app_name}" --force

git branch -D "${split_branch}"

echo "Done. ${app_name} branch on origin now has ${prefix}/ contents at its root."
echo "On a bench server: bench get-app <this-repo-url> --branch ${app_name}"
