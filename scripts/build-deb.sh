#!/usr/bin/env bash
# Bygger en arm64 .deb av Hemmet från denna dev-miljö.
# x86_64 build-värd fungerar — JS är portabelt och Prisma bundlas med
# arm64-binärer via binaryTargets i prisma/schema.prisma.
#
# Kör: bash scripts/build-deb.sh
# Output: dist/hemmet_<VERSION>_arm64.deb

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE_VERSION="$(cat VERSION | tr -d '[:space:]')"
if [ -z "$BASE_VERSION" ]; then
    echo "❌ VERSION-filen är tom" >&2
    exit 1
fi

# Debian/dpkg-konvention: `~` sorterar FÖRE nothing, så 1.0.0~rc1 < 1.0.0 < 1.0.1.
# Semver använder `-rc1` men det tolkas av dpkg som debian-revision (efter upstream)
# vilket gör att 1.0.0-rc1 skulle sorteras EFTER 1.0.0 — fel väg.
# Översätt första `-` till `~` för dpkg.
deb_version_from() {
    # Ex: 1.0.0-rc1 → 1.0.0~rc1  ;  0.1.0+dev.abc → 0.1.0+dev.abc (ingen förändring)
    printf '%s' "$1" | sed 's/-/~/'
}

# Avgör om detta är en "clean release" (HEAD är taggad med v<VERSION> + ren tree)
# eller en "dev build" (allt annat — får +dev.<shortsha>-suffix).
if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
    SHORT_SHA=$(git rev-parse --short=7 HEAD 2>/dev/null || echo "")
    DIRTY=""
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        DIRTY=".dirty"
    fi
    TAG_ON_HEAD=$(git tag --points-at HEAD 2>/dev/null | grep -E "^v?${BASE_VERSION}$" || true)

    if [ -n "$TAG_ON_HEAD" ] && [ -z "$DIRTY" ]; then
        SEMVER_VERSION="$BASE_VERSION"
        echo "▶ Clean release-bygge (tag $TAG_ON_HEAD på HEAD, rent tree)"
    else
        SEMVER_VERSION="${BASE_VERSION}+dev.${SHORT_SHA}${DIRTY}"
        if [ -n "$DIRTY" ]; then
            echo "▶ Dev-bygge (osparade ändringar) — version $SEMVER_VERSION"
        else
            echo "▶ Dev-bygge (ingen matchande tag på HEAD) — version $SEMVER_VERSION"
        fi
    fi
else
    SEMVER_VERSION="$BASE_VERSION"
    echo "▶ Git saknas — bygger som $SEMVER_VERSION (utan dev-suffix)"
fi

# Översätt till dpkg-kompatibel version (ersätt -rc1 → ~rc1 för korrekt sortering)
VERSION=$(deb_version_from "$SEMVER_VERSION")
PKGNAME="hemmet_${VERSION}_arm64"
echo "▶ Paketfilnamn: $PKGNAME.deb"
if [ "$VERSION" != "$SEMVER_VERSION" ]; then
    echo "  (semver: $SEMVER_VERSION)"
fi

# ── 1. Verktygskontroller ────────────────────────────────────
for cmd in dpkg-deb node npx; do
    if ! command -v "$cmd" >/dev/null; then
        echo "❌ $cmd saknas i PATH" >&2
        exit 1
    fi
done

# ── 2. Rensa dist/ ───────────────────────────────────────────
echo "▶ Rensar dist/"
rm -rf dist
STAGE="dist/${PKGNAME}"
mkdir -p "$STAGE/opt/hemmet"
mkdir -p "$STAGE/usr/lib/systemd/system"
mkdir -p "$STAGE/usr/sbin"
mkdir -p "$STAGE/DEBIAN"

# ── 3. Prisma-binärer (native + arm64) ───────────────────────
echo "▶ Genererar Prisma-klient"
npx prisma generate >/dev/null 2>&1

if [ ! -f node_modules/.prisma/client/libquery_engine-linux-arm64-openssl-3.0.x.so.node ]; then
    echo "❌ arm64 Prisma-binär saknas. Kolla binaryTargets i schema.prisma" >&2
    exit 1
fi

# ── 4. Next.js-build i standalone-läge ───────────────────────
echo "▶ Bygger Next.js (standalone)"
NODE_ENV=production npx next build 2>&1 | tail -5

if [ ! -d .next/standalone ]; then
    echo "❌ .next/standalone/ saknas. Är output: 'standalone' satt i next.config.ts?" >&2
    exit 1
fi

# ── 5. Stage app-filer ───────────────────────────────────────
APP="$STAGE/opt/hemmet"
echo "▶ Kopierar app-filer till $APP"

# Next.js standalone (server.js + minimal node_modules)
cp -r .next/standalone/. "$APP/"

# Static assets
mkdir -p "$APP/.next/static"
cp -r .next/static/. "$APP/.next/static/"

# Publika filer
if [ -d public ]; then
    mkdir -p "$APP/public"
    cp -r public/. "$APP/public/"
fi

# Prisma-schema + migrations
mkdir -p "$APP/prisma"
cp prisma/schema.prisma "$APP/prisma/"
cp -r prisma/migrations "$APP/prisma/"

# Prisma CLI + ALLA produktionsdeps (standalone bundlar bara Next:s egen tree).
# Använder `npm ls --omit=dev --json` för att få NPM:s exakta bild av vilka
# paket som är prod-deps. Fångar ESM-dynamic-imports och peer/optional-deps
# som min statiska tracer missade.
mkdir -p "$APP/node_modules"
echo "▶ Resolverar produktionsdeps via npm ls"
DEPS=$(node -e '
const { execSync } = require("child_process");
const tree = JSON.parse(execSync("npm ls --all --omit=dev --json 2>/dev/null || true", { maxBuffer: 64 * 1024 * 1024 }));
const seen = new Set();
function walk(obj) {
  if (!obj || !obj.dependencies) return;
  for (const [name, data] of Object.entries(obj.dependencies)) {
    seen.add(name);
    walk(data);
  }
}
walk(tree);
console.log([...seen].join("\n"));
')

COPIED=0
for name in $DEPS; do
    if [ -d "node_modules/$name" ]; then
        mkdir -p "$APP/node_modules/$(dirname $name)"
        if [ ! -e "$APP/node_modules/$name" ]; then
            cp -r "node_modules/$name" "$APP/node_modules/$name"
            COPIED=$((COPIED + 1))
        fi
    fi
done
echo "  $COPIED paket kopierade (totalt i trädet: $(echo "$DEPS" | wc -l))"

# Prisma-klientkatalogen (inkl. arm64-binär)
mkdir -p "$APP/node_modules/.prisma"
cp -r node_modules/.prisma/. "$APP/node_modules/.prisma/"

# Bort med x86_64 Prisma-binärer — de är bara dead weight på brunkan
find "$APP/node_modules" -name "libquery_engine-debian-openssl-*.so.node" -delete 2>/dev/null || true
find "$APP/node_modules" -name "libquery_engine-rhel-*.so.node" -delete 2>/dev/null || true
find "$APP/node_modules" -name "query-engine-debian-*" -delete 2>/dev/null || true
find "$APP/node_modules" -name "query-engine-rhel-*" -delete 2>/dev/null || true

# VERSION + env.example + bootstrap.js behövs av postinst/hemmet-setup
cp VERSION "$APP/"
mkdir -p "$APP/packaging"
cp packaging/env.example "$APP/packaging/"
cp packaging/bootstrap.js "$APP/packaging/"

# Bundla CLI för BRF-YAML-import via esbuild (TS → JS + alla deps)
mkdir -p "$APP/scripts"
npx esbuild prisma/brfs/cli.ts \
    --bundle --platform=node --target=node20 \
    --external:@prisma/client --external:prisma \
    --outfile="$APP/scripts/import-brf.js" 2>&1 | tail -3

# Fiktiv exempel-YAML — riktiga förenings-YAML:er ligger i local/ (utanför git/deb)
mkdir -p "$APP/examples"
cp prisma/brfs/example-brf.yaml "$APP/examples/"

# Viktigt: städa bort ev. local/ som Next.js file-tracing råkat få med.
# `local/` får ALDRIG läcka till .deb — innehåller persondata.
rm -rf "$APP/local" 2>/dev/null || true

# Sätt rimliga rättigheter
find "$STAGE/opt/hemmet" -type d -exec chmod 0755 {} +
find "$STAGE/opt/hemmet" -type f -exec chmod 0644 {} +
# server.js startas av systemd; exec-bit skadar inte
chmod 0644 "$STAGE/opt/hemmet/server.js" 2>/dev/null || true

# ── 6. systemd-service ───────────────────────────────────────
install -m 0644 packaging/hemmet.service "$STAGE/usr/lib/systemd/system/hemmet.service"

# ── 6b. Admin-kommandon till /usr/sbin/ ──────────────────────
for cmd in hemmet-setup hemmet-migrate hemmet-gen-secret hemmet-test-db hemmet-import-brf; do
    install -m 0755 "packaging/bin/$cmd" "$STAGE/usr/sbin/$cmd"
done

# ── 7. DEBIAN/control + maintainer-scripts ───────────────────
INSTALLED_SIZE=$(du -sk "$STAGE" | awk '{print $1}')

cat > "$STAGE/DEBIAN/control" <<EOF
Package: hemmet
Version: $VERSION
Section: web
Priority: optional
Architecture: arm64
Depends: nodejs (>= 20.0.0), postgresql-client (>= 14), openssl, sudo
Recommends: postgresql (>= 14), nginx
Suggests: certbot
Maintainer: John Thorburn <thorburn.john@gmail.com>
Installed-Size: $INSTALLED_SIZE
Homepage: https://github.com/thorburn/hemmet
Description: Hemmet BRF-stödplattform
 Hemmet är en digital plattform för svenska bostadsrättsföreningar.
 Stödjer styrelsearbete, medlemmar, boende, revisorer och externa
 integrationer. Konfigurationsdriven — anpassar sig till föreningens
 stadgar via BrfRules.
EOF

install -m 0755 packaging/postinst.sh "$STAGE/DEBIAN/postinst"
install -m 0755 packaging/prerm.sh    "$STAGE/DEBIAN/prerm"
install -m 0755 packaging/postrm.sh   "$STAGE/DEBIAN/postrm"

# ── 8. Bygg .deb ─────────────────────────────────────────────
STAGED_SIZE=$(du -sh "$STAGE/opt/hemmet/" | awk '{print $1}')
echo "▶ Staging klart: $STAGED_SIZE"
echo "▶ Bygger .deb"
dpkg-deb --build --root-owner-group "$STAGE" "dist/${PKGNAME}.deb" >/dev/null

DEB_FILE="dist/${PKGNAME}.deb"
DEB_SIZE=$(du -sh "$DEB_FILE" | awk '{print $1}')

# Rensa staging
rm -rf "$STAGE"

echo ""
echo "✓ Paket klart: $DEB_FILE ($DEB_SIZE)"
echo ""
echo "Inspektera: dpkg-deb -I $DEB_FILE  och  dpkg-deb -c $DEB_FILE | head -30"
echo ""
echo "Installera på brunkan:"
echo "  scp $DEB_FILE 10.10.244.133:/tmp/"
echo "  ssh 10.10.244.133 'sudo apt install /tmp/${PKGNAME}.deb'"
