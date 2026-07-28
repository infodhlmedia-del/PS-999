# Quick Setup Guide - PS 999 App

## Step-by-Step Installation

### 1. Prerequisites
Make sure you have installed:
- Node.js (Download from nodejs.org)
- A code editor (VS Code recommended)

### 2. Extract & Navigate
```bash
# Extract the ZIP file
# Open terminal/command prompt and navigate to the folder
cd PS999
```

### 3. Install Expo CLI (if not installed)
```bash
npm install -g expo-cli
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the App
```bash
npx expo start
```

## Running on Your Phone

### Android:
1. Install "Expo Go" app from Google Play Store
2. Scan the QR code shown in terminal
3. App will load on your phone

### iOS:
1. Install "Expo Go" app from App Store
2. Scan the QR code shown in terminal
3. App will load on your phone

## Running on Emulator/Simulator

### Android Emulator:
1. Install Android Studio
2. Set up an Android Virtual Device (AVD)
3. Run: `npm run android`

### iOS Simulator (Mac only):
1. Install Xcode
2. Run: `npm run ios`

## Running on Web:
```bash
npm run web
```

## Troubleshooting

### Error: "Cannot find module"
Solution: Run `npm install` again

### Error: "Port already in use"
Solution: Kill the process or use different port:
```bash
npx expo start --port 19001
```

### Cache Issues
Solution: Clear cache and restart:
```bash
npx expo start -c
```

## Testing the App

1. Navigate through all screens using the drawer menu (☰ icon)
2. Test buttons and navigation
3. Check responsive layout on different screen sizes

## Next Steps

### Adding Backend Integration:
1. Replace static data with API calls
2. Add authentication
3. Implement real-time game updates
4. Add payment gateway integration

### Publishing:
```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Important Files

- `App.js` - Main navigation setup
- `screens/` - All screen components
- `package.json` - Dependencies list
- `app.json` - App configuration

## Support

For any issues:
1. Check console logs for errors
2. Verify all dependencies are installed
3. Make sure you're using compatible Node.js version (v14+)

## Features Checklist

✅ Home Screen with drawer menu
✅ Add/Withdraw funds
✅ Game listings (Starline, Jackpot)
✅ Bid history
✅ Settings & notifications
✅ Transaction history
✅ Game rates display
✅ Call/WhatsApp integration

Happy Coding! 🚀
