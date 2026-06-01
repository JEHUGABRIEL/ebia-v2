#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# E-Bia — déploiement unifié web + mobile
# Usage : ./deploy.sh "message de commit"
# ─────────────────────────────────────────────────────────────
set -e

ADB="/home/pkf/Android/Sdk/platform-tools/adb"
APK="android/app/build/outputs/apk/debug/app-debug.apk"
PACKAGE="com.ebia.app"

MSG="${1:-deploy: mise à jour}"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        E-Bia — Déploiement           ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 1. Build web ──────────────────────────────────────────────
echo "▶ [1/5] Build web..."
npm run build

# ── 2. Git push → Render auto-déploie le site web ────────────
echo ""
echo "▶ [2/5] Push GitHub → déploiement Render (web)..."
git add -A
git diff --cached --quiet && echo "  (rien à committer)" || git commit -m "$MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
echo "  ✓ Web en cours de déploiement sur Render"

# ── 3. Sync Capacitor ─────────────────────────────────────────
echo ""
echo "▶ [3/5] Sync Capacitor (web → Android)..."
npx cap sync android

# ── 4. Build APK ──────────────────────────────────────────────
echo ""
echo "▶ [4/5] Build APK Android..."
cd android
./gradlew assembleDebug --no-daemon -q
cd ..
echo "  ✓ APK: $APK"

# ── 5. Install sur le téléphone connecté ─────────────────────
echo ""
echo "▶ [5/5] Installation sur le téléphone..."
DEVICES=$("$ADB" devices | grep -v "List of" | grep "device$" | awk '{print $1}')

if [ -z "$DEVICES" ]; then
  echo "  ⚠ Aucun téléphone détecté (USB débranché ?)"
  echo "    Pour installer manuellement : adb install -r $APK"
else
  for DEVICE in $DEVICES; do
    MODEL=$("$ADB" -s "$DEVICE" shell getprop ro.product.model 2>/dev/null | tr -d '\r')
    echo "  → Installation sur $MODEL ($DEVICE)..."
    "$ADB" -s "$DEVICE" install -r "$APK"
    "$ADB" -s "$DEVICE" shell am start -n "$PACKAGE/.MainActivity" 2>/dev/null || true
    echo "    ✓ App lancée"
  done
fi

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ Déploiement terminé"
echo "  🌐 Web   → https://e-bia.onrender.com"
echo "  📱 Mobile → installé sur le téléphone"
echo "══════════════════════════════════════════"
echo ""
