#!/usr/bin/env bash
# Bumpar VERSION enligt semver och taggar git.
#
# Användning:
#   bash scripts/bump-version.sh patch       # 0.1.0 → 0.1.1
#   bash scripts/bump-version.sh minor       # 0.1.1 → 0.2.0
#   bash scripts/bump-version.sh major       # 0.2.0 → 1.0.0
#   bash scripts/bump-version.sh release     # 1.0.0-rc1 → 1.0.0 (ta bort suffix)
#   bash scripts/bump-version.sh 1.0.0-rc2   # explicit version (stöd för suffix)
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
# Tillåt valfri pre-release-suffix (X.Y.Z eller X.Y.Z-suffix)
if ! echo "$CURRENT" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.]+)?$'; then
    echo "❌ Nuvarande VERSION '$CURRENT' är inte giltig semver (X.Y.Z[-suffix])" >&2
    exit 1
fi

# Extrahera X.Y.Z-delen (utan suffix) för automatisk bump
CORE=$(echo "$CURRENT" | sed 's/-.*$//')
IFS='.' read -r MAJ MIN PAT <<< "$CORE"

case "$BUMP" in
    patch)
        # patch bumpar kärnan och rensar pre-release-suffix
        NEW="$MAJ.$MIN.$((PAT + 1))" ;;
    minor)
        NEW="$MAJ.$((MIN + 1)).0" ;;
    major)
        NEW="$((MAJ + 1)).0.0" ;;
    release)
        # "release" = ta bort pre-release-suffix och sätt X.Y.Z (t.ex. 1.0.0-rc1 → 1.0.0)
        NEW="$CORE"
        if [ "$NEW" = "$CURRENT" ]; then
            echo "ℹ  Ingen pre-release-suffix att ta bort (redan $NEW)"
            exit 0
        fi
        ;;
    *)
        if echo "$BUMP" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.]+)?$'; then
            NEW="$BUMP"
        else
            echo "❌ Okänd bumpning: $BUMP" >&2
            echo "   Giltiga: patch | minor | major | release | X.Y.Z | X.Y.Z-suffix" >&2
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
