# 🏗️ Build Fix Guide - Splash Screen Error

## 🚨 Error: splashscreen_background not found

This error happens during Android build. Here's the complete fix:

---

## ⚡ QUICK FIX (Copy-Paste)

```bash
cd PS999
rm -rf node_modules package-lock.json .expo android ios
npm cache clean --force
npm install --legacy-peer-deps
npx expo prebuild --clean
npx expo start -c
```

---

## 📱 For Expo Go (Development)

If you're just testing in Expo Go (not building APK):

```bash
cd PS999
rm -rf node_modules package-lock.json .expo
npm cache clean --force
npm install --legacy-peer-deps
npx expo start -c
```

Then scan QR code in Expo Go - **No build needed!** ✅

---

## 🔨 For Building APK/AAB

### Method 1: EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android --profile preview

# Or for production
eas build --platform android --profile production
```

### Method 2: Local Build

```bash
# Prebuild native folders
npx expo prebuild --clean

# For Android
cd android
./gradlew clean
./gradlew assembleRelease

# APK will be in: android/app/build/outputs/apk/release/
```

---

## ✅ What Was Fixed

1. **Added splash screen config** in app.json
2. **Added expo-splash-screen** package
3. **Set background color** (#9D5B7E - app theme color)
4. **Added splash screen plugin** in app.json

---

## 📝 app.json Changes

```json
{
  "expo": {
    "splash": {
      "backgroundColor": "#9D5B7E",
      "resizeMode": "contain"
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#9D5B7E",
          "resizeMode": "contain"
        }
      ]
    ]
  }
}
```

---

## 🎯 Recommended: Use EAS Build

Building locally is complex. EAS Build is easier:

### Setup:
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build:
```bash
# For testing
eas build --platform android --profile preview

# For Play Store
eas build --platform android --profile production
```

### Why EAS?
- ✅ Handles all dependencies
- ✅ Cloud-based (no Android Studio needed)
- ✅ Automatic code signing
- ✅ Direct APK download link

---

## 💡 For Development (No Build Needed)

**Just use Expo Go!**

```bash
npm install --legacy-peer-deps
npx expo start -c
```

Scan QR code and test! No build required! 🎉

---

## 🔧 If Build Still Fails

### Clean Everything:
```bash
# Remove all build artifacts
rm -rf node_modules package-lock.json
rm -rf android ios .expo
rm -rf ~/.gradle/caches

# Clear npm
npm cache clean --force

# Reinstall
npm install --legacy-peer-deps

# Try EAS instead of local build
eas build --platform android
```

---

## 📱 Testing Strategy

1. **Development:** Use Expo Go (fastest)
2. **Testing:** Build with EAS preview profile
3. **Production:** Build with EAS production profile

---

## 🆘 Common Build Errors

### Error: Gradle build failed
**Solution:** Use EAS Build instead

### Error: Android SDK not found
**Solution:** Use EAS Build (cloud-based)

### Error: Resource not found
**Solution:** Run `npx expo prebuild --clean` first

### Error: Module not found during build
**Solution:** 
```bash
rm -rf node_modules
npm install --legacy-peer-deps
npx expo prebuild --clean
```

---

## ✅ Success Checklist

For Expo Go:
- [ ] Installed with `--legacy-peer-deps`
- [ ] Started with `-c` flag
- [ ] App opens in Expo Go

For APK Build:
- [ ] Used EAS Build
- [ ] Build completed successfully
- [ ] Downloaded APK
- [ ] Installed on device

---

## 🎉 Recommended Workflow

**Development:**
```bash
npx expo start
# Use Expo Go for testing
```

**When Ready to Build:**
```bash
eas build --platform android --profile preview
# Download and install APK
```

**For Play Store:**
```bash
eas build --platform android --profile production
# Download AAB for Play Store
```

---

## 📞 Need More Help?

- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- Splash Screen: https://docs.expo.dev/versions/latest/sdk/splash-screen/

---

**Remember:** For development, just use Expo Go! Building is only needed for production! 🚀
