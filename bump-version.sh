#!/bin/bash
# Aktualizuje APP_VERSION w js/data.js
# Format: 1.2.RRMMDD.HHmm (jak w pos-app)
# Użycie: bash bump-version.sh

STAMP=$(TZ="Europe/Warsaw" date +"%y%m%d.%H%M")
VERSION="1.2.${STAMP}"

sed -i "s/const APP_VERSION = '.*'/const APP_VERSION = '${VERSION}'/" js/data.js
echo "Version: ${VERSION}"
