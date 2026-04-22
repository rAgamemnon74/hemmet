#!/bin/sh
# Hemmet postrm — körs efter avinstallation
set -e

if [ -d /run/systemd/system ]; then
    systemctl daemon-reload 2>/dev/null || true
fi

# Vid purge — ta bort data och användare. "remove" lämnar data kvar.
if [ "$1" = "purge" ]; then
    rm -rf /etc/hemmet
    rm -rf /var/lib/hemmet
    if id hemmet >/dev/null 2>&1; then
        deluser --quiet hemmet 2>/dev/null || true
    fi
    if getent group hemmet >/dev/null 2>&1; then
        delgroup --quiet hemmet 2>/dev/null || true
    fi
fi

exit 0
