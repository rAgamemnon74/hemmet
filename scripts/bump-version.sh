#!/usr/bin/env bash
# Bumpar VERSION enligt semver och taggar git.
#
# Användning:
#   bash scripts/bump-version.sh patch       # 0.1.0 → 0.1.1
#   bash scripts/bump-version.sh minor       # 0.1.1 → 0.2.0
#   bash scripts/bump-version.sh major       # 0.2.0 → 1.0.0
#   bash scripts/bump-version.sh 0.5.0       # explicit version
#
# Skapar inte commit eller tagg automatiskt — det är admin's jobb efter att
# CHANGELOG.md har uppdaterats.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BUMP="${1:-}"
if [ -z "$BUMP" ]; then
    echo "Användning: $0 [patch|minor|major|X.Y.Z]" >&2
    exit 2
fi

CURRENT=$(cat VERSION | tr -d '[:space:]')
if ! echo "$CURRENT" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    echo "❌ Nuvarande VERSION '$CURRENT' är inte X.Y.Z" >&2
    exit 1
fi

IFS='.' read -r MAJ MIN PAT <<< "$CURRENT"

case "$BUMP" in
    patch)
        NEW="$MAJ.$MIN.$((PAT + 1))" ;;
    minor)
        NEW="$MAJ.$((MIN + 1)).0" ;;
    major)
        NEW="$((MAJ + 1)).0.0" ;;
    *)
        if echo "$BUMP" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
            NEW="$BUMP"
        else
            echo "❌ Okänd bumpning: $BUMP" >&2
            exit 2
        fi
        ;;
esac

echo "$NEW" > VERSION
echo "✓ VERSION: $CURRENT → $NEW"
echo ""
echo "Nästa steg:"
echo "  1. Uppdatera CHANGELOG.md med release notes för $NEW"
echo "  2. git add VERSION CHANGELOG.md"
echo "  3. git commit -m \"Release $NEW\""
echo "  4. git tag -a v$NEW -m \"Release $NEW\""
echo "  5. bash scripts/build-deb.sh"
