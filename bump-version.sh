#!/bin/bash
# Aktualizuje APP_VERSION w js/data.js i CACHE_VERSION w sw.js
# Format: 1.5.RRMMDD.HHmm
# Użycie: bash bump-version.sh

STAMP=$(TZ="Europe/Warsaw" date +"%y%m%d.%H%M")
VERSION="1.5.${STAMP}"

sed -i "s/const APP_VERSION = '.*'/const APP_VERSION = '${VERSION}'/" js/data.js
sed -i "s/const CACHE_VERSION = '.*'/const CACHE_VERSION = '${VERSION}'/" sw.js
echo "Version: ${VERSION}"
