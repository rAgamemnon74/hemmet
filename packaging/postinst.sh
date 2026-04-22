#!/bin/sh
# Hemmet postinst — körs efter att paketfiler kopierats ut
set -e

# ── 1. Skapa systemanvändare om den inte finns ───────────────
if ! id hemmet >/dev/null 2>&1; then
    adduser --system --group --no-create-home --home /opt/hemmet \
        --shell /usr/sbin/nologin hemmet
fi

# ── 2. Skapa och ägare-sätt data-katalogen ───────────────────
install -d -m 0755 -o hemmet -g hemmet /var/lib/hemmet
install -d -m 0755 -o hemmet -g hemmet /var/lib/hemmet/uploads

# ── 3. Ägare på app-filerna ──────────────────────────────────
chown -R hemmet:hemmet /opt/hemmet

# ── 4. Installera env-mall om ingen env finns ────────────────
if [ ! -e /etc/hemmet/env ]; then
    install -d -m 0750 -o root -g hemmet /etc/hemmet
    install -m 0640 -o root -g hemmet \
        /opt/hemmet/packaging/env.example /etc/hemmet/env
    FRESH_INSTALL=1
else
    FRESH_INSTALL=0
fi

# ── 5. Ladda om systemd ──────────────────────────────────────
if [ -d /run/systemd/system ]; then
    systemctl daemon-reload
fi

# ── 6. PostgreSQL-kontroll ───────────────────────────────────
PG_LOCAL=0
if command -v psql >/dev/null 2>&1; then
    if systemctl is-active --quiet postgresql 2>/dev/null; then
        PG_LOCAL=1
    fi
fi

# ── 7. Statusrapport ─────────────────────────────────────────
echo ""
echo "============================================================"
echo "Hemmet $(cat /opt/hemmet/VERSION 2>/dev/null || echo "") installerat."
echo ""

if [ "$FRESH_INSTALL" = "1" ]; then
    echo "Detta är en förstagångs-installation."
    echo ""

    # Auto-kör setup om: (a) lokal PG kör, (b) inte explicit opt-out
    AUTO_SETUP=1
    [ "${HEMMET_SKIP_AUTO_SETUP:-0}" = "1" ] && AUTO_SETUP=0
    [ "$PG_LOCAL" != "1" ] && AUTO_SETUP=0

    if [ "$AUTO_SETUP" = "1" ]; then
        echo "▶ Lokal PostgreSQL upptäcktes — kör hemmet-setup automatiskt."
        echo "  (Sätt HEMMET_SKIP_AUTO_SETUP=1 för att hoppa över.)"
        echo ""
        if /usr/sbin/hemmet-setup; then
            : # hemmet-setup skriver sin egen success-banner
        else
            echo ""
            echo "⚠  hemmet-setup misslyckades. Kör manuellt när du åtgärdat problemet:"
            echo "    sudo hemmet-setup"
        fi
    elif [ "$PG_LOCAL" = "1" ]; then
        echo "PostgreSQL-server upptäcktes lokalt, men auto-setup är avstängt."
        echo "Kör när du är redo:"
        echo ""
        echo "    sudo hemmet-setup"
    else
        echo "Ingen lokal PostgreSQL-server hittades."
        echo ""
        echo "Du kan antingen:"
        echo "  (a) Installera lokalt:  sudo apt install postgresql"
        echo "                          sedan: sudo hemmet-setup"
        echo ""
        echo "  (b) Använda fjärr-DB:   sudo -e /etc/hemmet/env"
        echo "                          (sätt DATABASE_URL + AUTH_SECRET)"
        echo "                          sedan: sudo hemmet-migrate"
        echo "                          sedan: sudo systemctl enable --now hemmet"
    fi
else
    # Uppgradering — kör migrations automatiskt om env är fullständig
    if [ -d /run/systemd/system ] && \
       ! grep -q "CHANGE_ME" /etc/hemmet/env 2>/dev/null; then
        echo "▶ Uppgradering — kör databas-migrations..."
        if /usr/sbin/hemmet-migrate 2>&1; then
            echo "✓ Migrations klara."
        else
            echo "⚠  Migrations misslyckades. Kör manuellt: sudo hemmet-migrate"
        fi

        # Restarta service om den kör
        if systemctl is-active --quiet hemmet.service 2>/dev/null; then
            systemctl restart hemmet.service
            echo "✓ Service omstartad."
        else
            echo "ℹ  Service inte aktiv — starta med: sudo systemctl start hemmet"
        fi
    else
        echo "⚠  /etc/hemmet/env verkar inte helt konfigurerad."
        echo "   Kör 'sudo hemmet-setup' för förstagångs-konfig."
    fi
fi

echo ""
echo "Adminkommandon:"
echo "  hemmet-setup       — förstagångs-installation (DB + secret + migrate + start)"
echo "  hemmet-migrate     — kör DB-migrations"
echo "  hemmet-test-db     — testa databasanslutning"
echo "  hemmet-gen-secret  — regenerera AUTH_SECRET"
echo "============================================================"

exit 0
