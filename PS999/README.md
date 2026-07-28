# PS 999 App - React Native Expo

A full-featured gaming/betting application built with React Native and Expo.

## Features

### Authentication
- ✅ Login Screen with Phone Number
- ✅ Registration Screen with User Details

### Home & Navigation
- ✅ Home Screen with Game Listings
- ✅ Side Drawer Navigation
- ✅ Bottom Tab Navigation
- ✅ Balance Display
- ✅ Call & WhatsApp Integration

### Game Types
- ✅ Single Digit (Easy & Special Mode)
- ✅ Single Digit Bulk (Number Grid)
- ✅ Single Pana
- ✅ Single Pana Bulk
- ✅ Double Pana
- ✅ Double Pana Bulk
- ✅ Triple Pana
- ✅ Pana Family
- ✅ SP DP TP (with checkboxes & auto-generate)
- ✅ Two Digit Pana

### Financial
- ✅ Add Money / Withdraw Money
- ✅ Funds Management
- ✅ Transaction History
- ✅ Passbook

### Other Features
- ✅ My Bids History
- ✅ PS Starline & PS Jackpot Games
- ✅ Notification Settings
- ✅ Game Rate Display
- ✅ Time Table
- ✅ Update Password

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (optional)

## Installation

**IMPORTANT: This project uses Expo SDK 52 (Stable Version)**

1. Extract the ZIP file
2. Navigate to the project directory:
```bash
cd PS999
```

3. Clean install (IMPORTANT):
```bash
# Windows
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install

# Mac/Linux
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

4. Start the app:
```bash
npx expo start -c
```

## Running the App

### Quick Start:
```bash
npx expo start -c
```

### Run on Phone:
1. Install **Expo Go** app (any version works!)
2. Make sure phone & computer are on same WiFi
3. Scan QR code from terminal
4. App will load!

## ⚠️ Troubleshooting

### Error: "PlatformConstants could not be found"
```bash
rm -rf node_modules package-lock.json .expo
npm cache clean --force
npm install
npx expo start -c
```

### Error: "Cannot find module"
```bash
npm cache clean --force
npm install babel-preset-expo --save-dev
npm install
npx expo start -c
```

### App not loading
1. Check same WiFi network
2. Restart Expo Go app
3. Press 'r' in terminal to reload
4. Try `npx expo start -c`

**See QUICK_FIX.md for detailed troubleshooting.**

## Project Structure

```
PS999/
├── App.js                     # Main app component with navigation
├── app.json                  # Expo configuration
├── package.json              # Dependencies
├── babel.config.js           # Babel configuration
├── screens/                  # All screen components
│   ├── LoginScreen.js        # Login with phone number
│   ├── RegisterScreen.js     # User registration
│   ├── HomeScreen.js         # Main home with drawer
│   ├── GameDetailScreen.js   # Game type selection grid
│   ├── SingleDigitGame.js    # Easy/Special mode betting
│   ├── SingleDigitBulkGame.js # Number grid betting
│   ├── SinglePanaGame.js     # Single pana betting
│   ├── SPDPTPGame.js         # SP/DP/TP with auto-generate
│   └── ... (other game screens)
└── assets/                   # Images and other assets
```

## Key Technologies

- React Native
- Expo
- React Navigation
- Expo Vector Icons

## Color Scheme

- Primary: #A6738C (Mauve/Rose)
- Secondary: #F5C542 (Yellow/Gold)
- Background: #F5EDE0 (Cream)
- Accent: #5D3A2E (Brown)
- Success: #4CAF50 (Green)
- Error: #D32F2F (Red)

## App Flow

1. **Login Screen** → Enter phone number
2. **Home Screen** → View games, use drawer menu
3. **Click on Game** → Opens GameDetailScreen
4. **Select Game Type** → Opens specific game screen (Single Digit, Pana, etc.)
5. **Place Bids** → Add bids and submit

## Game Modes

### Easy Mode
Simple form-based bidding with:
- Select game type (OPEN/CLOSE)
- Enter digit/pana
- Enter points
- Add to cart
- Submit

### Special Mode
Advanced bidding with:
- Date selection
- Bulk entry options
- Number grids
- Auto-generate features (SP/DP/TP)

## Customization

You can customize the app by:
- Modifying colors in each screen's StyleSheet
- Adding/removing game types in GameDetailScreen
- Updating game data and rates
- Adding backend API integration
- Implementing real payment gateways

## Notes

- This is a frontend-only implementation
- Backend integration needed for full functionality
- Phone numbers and user data are placeholder values
- All game data is static and needs API connection
- Utility screens are placeholders - can be fully implemented as needed

## Next Steps for Production

### Backend Integration:
1. User authentication API
2. Game bid submission API
3. Real-time game results
4. Payment gateway integration
5. Transaction history API
6. Notification system

### Additional Features:
1. OTP verification
2. Bank account management
3. Withdrawal requests
4. Bid history with filters
5. Live results display
6. Push notifications

## Support

For issues or questions, check the SETUP_GUIDE.md file.

## License

Private - All rights reserved
"# psclassic" 
