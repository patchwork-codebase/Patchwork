#!/bin/bash
# Patchwork Mobile Distribution Script
# This script builds the Flutter app and uploads the release binaries to GitHub Releases and Firebase App Distribution.
# Requirements:
# - GitHub CLI (`gh`) installed and authenticated
# - Firebase CLI (`firebase`) installed and authenticated
# - Flutter installed

set -e

echo "🚀 Starting Patchwork Mobile Build & Distribution..."

# 1. Ask for version number
read -p "Enter the version number for this release (e.g. 1.0.5): " VERSION_NAME
if [ -z "$VERSION_NAME" ]; then
  echo "Error: Version name is required."
  exit 1
fi

# 2. Build the Android APK
echo "📦 Building Android APK (Release)..."
cd ../
flutter build apk --release
APK_PATH="build/app/outputs/flutter-apk/app-release.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK build failed. File not found at $APK_PATH"
    exit 1
fi

# 3. Create GitHub Release
echo "🐙 Creating GitHub Release v$VERSION_NAME..."
if command -v gh &> /dev/null; then
  gh release create "v$VERSION_NAME" "$APK_PATH" \
    --title "Patchwork Mobile v$VERSION_NAME" \
    --notes "Automated release of Patchwork Mobile version $VERSION_NAME."
  echo "✅ Successfully uploaded APK to GitHub Releases!"
else
  echo "⚠️ GitHub CLI ('gh') is not installed or not in PATH."
  echo "👉 APK is ready at: $APK_PATH"
  echo "👉 You can upload it manually to: https://github.com/patchwork-codebase/Patchwork/releases/tag/v$VERSION_NAME"
  echo "👉 Or install gh with: winget install --id GitHub.cli"
fi

# 4. (Optional) Upload to Firebase App Distribution for internal testers
read -p "Do you want to distribute to Firebase App Distribution? (y/n): " UPLOAD_FIREBASE
if [ "$UPLOAD_FIREBASE" == "y" ]; then
  read -p "Enter your Firebase App ID (found in Firebase Console): " FIREBASE_APP_ID
  echo "🔥 Uploading to Firebase App Distribution..."
  firebase appdistribution:distribute "$APK_PATH" \
    --app "$FIREBASE_APP_ID" \
    --release-notes "Version $VERSION_NAME release" \
    --groups "internal-testers"
  echo "✅ Successfully distributed to Firebase!"
fi

echo "🎉 All done! Your mobile app is now on the CDN."
