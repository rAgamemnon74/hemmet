#!/bin/sh
# Hemmet prerm — körs före avinstallation/uppgradering
set -e

if [ -d /run/systemd/system ]; then
    # Stanna service om den kör, men lämna enable-state orörd vid uppgradering
    if [ "$1" = "remove" ] || [ "$1" = "purge" ]; then
        systemctl stop hemmet.service 2>/dev/null || true
        systemctl disable hemmet.service 2>/dev/null || true
    elif [ "$1" = "upgrade" ]; then
        systemctl stop hemmet.service 2>/dev/null || true
    fi
fi

exit 0
