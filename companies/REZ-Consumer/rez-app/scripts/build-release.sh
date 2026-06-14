#!/usr/bin/env bash
# REZ App — Native Release Build Script
# Run this from the rezapp/nuqta-master directory after any native config change
# (associatedDomains, intentFilters, app.config.js, etc.)
#
# Usage:
#   ./scripts/build-release.sh           # builds both iOS + Android
#   ./scripts/build-release.sh ios       # iOS only
#   ./scripts/build-release.sh android   # Android only

set -euo pipefail
cd "$(dirname "$0")/.."

PLATFORM="${1:-both}"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║         REZ App — EAS Release Build          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Pre-flight checks ──────────────────────────────────────────────────────────

echo "▶ Checking prerequisites..."

if ! command -v eas &>/dev/null; then
  echo "  ✗ EAS CLI not found. Install with: npm install -g eas-cli"
  exit 1
fi

if ! eas whoami &>/dev/null 2>&1; then
  echo "  ✗ Not logged in to EAS. Run: eas login"
  exit 1
fi

echo "  ✓ EAS CLI ready"

# Check Android fingerprint placeholder
ASSETLINKS="$(cd ../.. && pwd)/dist/.well-known/assetlinks.json"
if [ -f "$ASSETLINKS" ]; then
  if grep -q "REPLACE_WITH_ACTUAL_SHA256_CERT_FINGERPRINT" "$ASSETLINKS"; then
    echo ""
    echo "  ⚠️  WARNING: Android SHA-256 fingerprint is still a placeholder!"
    echo "     File: $ASSETLINKS"
    echo "     Get from: Play Console → App signing → SHA-256 certificate fingerprint"
    echo "     Or run:   eas credentials → Android → Production → view signing cert"
    echo ""
    echo "  The build will proceed but Android universal links WON'T work until"
    echo "  you replace the fingerprint and redeploy the web menu."
    echo ""
    read -r -p "  Continue anyway? [y/N] " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || exit 0
  else
    echo "  ✓ Android fingerprint is set"
  fi
fi

echo ""

# ── Build ──────────────────────────────────────────────────────────────────────

build_ios() {
  echo "▶ Building iOS (production)..."
  eas build --platform ios --profile production --non-interactive
  echo "  ✓ iOS build submitted"
}

build_android() {
  echo "▶ Building Android (production)..."
  eas build --platform android --profile production --non-interactive
  echo "  ✓ Android build submitted"
}

case "$PLATFORM" in
  ios)     build_ios ;;
  android) build_android ;;
  both)    build_ios; build_android ;;
  *)
    echo "Usage: $0 [ios|android|both]"
    exit 1
    ;;
esac

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║              Build(s) Submitted               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Monitor at: https://expo.dev/accounts/[your-account]/projects/nuqta"
echo "  Or run:     eas build:list --limit 5"
echo ""
echo "  After build completes:"
echo "  iOS     → Submit to App Store: eas submit --platform ios"
echo "  Android → Submit to Play Store: eas submit --platform android"
echo ""
echo "  ⚠️  These are NATIVE builds. OTA updates will NOT apply to"
echo "     associatedDomains / intentFilters changes — users must update the app."
echo ""
