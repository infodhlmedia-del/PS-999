import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Image, StyleSheet, Text, Platform, Alert, ActivityIndicator } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Foreground notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Auth Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// Main Screens
import HomeScreen from './screens/HomeScreen';
import GameDetailScreen from './screens/gamehome/GameDetailScreen';

// Game Play Screens (from games folder)
import SingleDigitGame from './screens/games/singleank/SingleDigitGame';
import JodiGame from './screens/games/jodi/JodiGame';
import SinglePanaGame from './screens/games/singlepatti/SinglePanaGame';
import DoublePanaGame from './screens/games/doublepatti/DoublePanaGame';
import TriplePanaGame from './screens/games/triplepana/TriplePanaGame';
import HalfSangamAGame from './screens/games/halfsangamA/HalfSangamAGame';
import HalfSangamBGame from './screens/games/halfsangamB/HalfSangamBGame';
import SPDPTPGame from './screens/games/spdptp/SPDPTPGame';
import SPMotorGame from './screens/games/spmotargame/SPMotorGame';
import DPMotorGame from './screens/games/dpmotargame/DPMotorGame';
import RedJodiGame from './screens/games/redjodigame/RedJodiGame';
import OddEvenGame from './screens/games/oddeven/OddEvenGame';
import FullSangamGame from './screens/games/fullsangam/FullSangamGame';


//startline games import 
import PSStarlineScreen from './screens/starline/PSStarlineScreen';
import StarlineGameDetailScreen from './screens/starline/StarlineGameDetailScreen';
import StarLineSingleDigitGame from './screens/starline/starlinesgames/games/StarLineSingleank/StarLineSingleDigitGame';
import StarLineSinglePanaGame from './screens/starline/starlinesgames/games/StarLinesinglepatti/StarLineSinglePanaGame';
import StarlineDoublePanaGame from './screens/starline/starlinesgames/games/StarLineDoublePatti/StarLineDoublePatti';
import StarlineTriplePanaGame from './screens/starline/starlinesgames/games/StarLineTripplePanaGame/StarLineTripplePanaGame';
import StarlineSPDPTPGame from './screens/starline/starlinesgames/games/StarLineSPDPTPGame/StarLinespdptp';
import StarlineSPMotorGame from './screens/starline/starlinesgames/games/StarLineSpmotargame/StarLineSpmotargame';
import StarLineDPMotorGame from './screens/starline/starlinesgames/games/StarlineDPmotar/StarlineDPmotar';
import StarlineEvenOddGame from './screens/starline/starlinesgames/games/StarlineEvenOdd/StarLineEvenOdd';


//js jackpot Screen
import JackpotGameDetailScreen from './screens/PsJackpot/PSJackpotGameDetailsScreen';
import PSJackpotScreen from './screens/PsJackpot/PSJackpotScreen';
import JackpotSingleGame from './screens/PsJackpot/PSJackpotGames/games/JackpotSingle/JackpotSingleGame';
import JackpotJodiGame from './screens/PsJackpot/PSJackpotGames/games/JackpotJodi/JackpotJodi';

// Utility Screens  
import MyBidsScreen from './screens/sidebar-items/MyBidsScreen';
import PassbookScreen from './screens/sidebar-items/PassbookScreen';
import FundsScreen from './screens/sidebar-items/FundsScreen';
import NotificationScreen from './screens/sidebar-items/NotificationScreen';
import SettingsScreen from './screens/sidebar-items/SettingsScreen';
import GameRateScreen from './screens/sidebar-items/GameRateScreen';
import TimeTableScreen from './screens/sidebar-items/TimeTableScreen';
import UpdatePasswordScreen from './screens/sidebar-items/UpdatePasswordScreen';
import QRCodePaymentScreen from './screens/sidebar-items/QRCodePayment';

import AddFundScreen from './screens/sidebar-items/AddFundScreen';
import WithdrawFundScreen from './screens/sidebar-items/WithdrawFundScreen';
import NoticeBoardScreen from './screens/sidebar-items/NoticeBoardScreen';
import HowToPlayScreen from './screens/sidebar-items/HowToPlayScreen';
import ChangePasswordScreen from './screens/sidebar-items/ChangePasswordScreen';
import AddFundHistoryScreen from './screens/sidebar-items/AddFundHistoryScreen';
import WithdrawFundHistoryScreen from './screens/sidebar-items/WithdrawFundHistoryScreen';
import UpdateBankDetailsScreen from './screens/sidebar-items/UpdateBankDetailsScreen';
import MyProfileScreen from './screens/sidebar-items/MyProfileScreen';
import MpinScreen from './screens/sidebar-items/MpinScreen';

//Game charts
import ChartsScreen from './screens/GameCharts/GameChartsScreen';
import MatkaChartsListScreen from './screens/GameCharts/MatkaChart/MatkaChartsListScreen';
import StarlineChart from './screens/GameCharts/StarLineChart/StarLineChart';
import JackpotChartListScreen from './screens/GameCharts/JackpotChart/JackpotChartListScreen';
import JodiChartScreen from './screens/GameCharts/MatkaChart/JodiChartScreen';
import PanelChartScreen from './screens/GameCharts/MatkaChart/PanelChartScreen';


import GameResults from './screens/all-games-historyANDresults/GameResults';
import BidHistoryScreen from './screens/all-games-historyANDresults/BidHistoryScreen';
import PSStarlineResultScreen from './screens/all-games-historyANDresults/PSStarlineResultScreen';
import PSjackpotResultScreen from './screens/all-games-historyANDresults/PSjackpotResultScreen';

import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';
import {
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
} from '@expo-google-fonts/raleway';
import * as SplashScreen from 'expo-splash-screen';
const Stack = createStackNavigator();

SplashScreen.preventAutoHideAsync();

// Loading Screen Component
const { width: SCREEN_WIDTH } = require('react-native').Dimensions.get('window');
const LOGO_SIZE = SCREEN_WIDTH * 0.35; // 35% of screen width — fits well without cutting

const LoadingScreen = () => (
  <View style={loadingStyles.container}>
    <Image
      source={require('./assets/splash/splash-screen.png')}
      style={loadingStyles.logo}
      resizeMode="contain"
    />
    <ActivityIndicator size="large" color="#C36578" style={{ marginTop: 30 }} />
    <Text style={loadingStyles.loadingText}>Loading PS 999...</Text>
  </View>
);


const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  }
});

export default function App() {
  const [loaded, error] = useFonts({
    // Custom Fonts
    'ModernSans': require('./assets/fonts/ModernSans-Regular.ttf'),
    // Google Fonts
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
    Raleway_400Regular,
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      // Add a slight delay so the loading screen is actually visible
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 3000); // 3 seconds delay for a better "loading" feel
    }

    // --- Push Notifications Setup ---
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log("Mera FCM Token ye hai:", token);
        // Tip: You can save this token to AsyncStorage or send it to your backend
      }
    });

    // Listener for when a notification is received while the app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("Foreground Notification aayi!", notification);
    });

    // Listener for when a user interacts with a notification (taps it)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("User ne click kiya!", response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [loaded, error]);

  if (!loaded && !error) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Auth Screens */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />

          {/* Main Screens */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="GameDetail" component={GameDetailScreen} />

          {/* Game Play Screens */}
          <Stack.Screen name="SingleDigitGame" component={SingleDigitGame} />
          <Stack.Screen name="JodiGame" component={JodiGame} />
          <Stack.Screen name="SinglePanaGame" component={SinglePanaGame} />
          <Stack.Screen name="DoublePanaGame" component={DoublePanaGame} />
          <Stack.Screen name="TriplePanaGame" component={TriplePanaGame} />
          <Stack.Screen name="FullSangamGame" component={FullSangamGame} />
          <Stack.Screen name="HalfSangamAGame" component={HalfSangamAGame} />
          <Stack.Screen name="HalfSangamBGame" component={HalfSangamBGame} />
          <Stack.Screen name="SPDPTPGame" component={SPDPTPGame} />
          <Stack.Screen name="SPMotorGame" component={SPMotorGame} />
          <Stack.Screen name="DPMotorGame" component={DPMotorGame} />
          <Stack.Screen name="RedJodiGame" component={RedJodiGame} />
          <Stack.Screen name="OddEvenGame" component={OddEvenGame} />
          <Stack.Screen name="GameResults" component={GameResults} />


          {/* Utility Screens */}
          <Stack.Screen name="AddFund" component={AddFundScreen} />
          <Stack.Screen name="WithdrawFund" component={WithdrawFundScreen} />
          <Stack.Screen name="MyBids" component={MyBidsScreen} />
          <Stack.Screen name="Passbook" component={PassbookScreen} />
          <Stack.Screen name="Funds" component={FundsScreen} />
          <Stack.Screen name="Notification" component={NotificationScreen} />
          <Stack.Screen name="GameRate" component={GameRateScreen} />
          <Stack.Screen name="TimeTable" component={TimeTableScreen} />
          <Stack.Screen name="PSStarline" component={PSStarlineScreen} />
          <Stack.Screen name="StarlineGameDetail" component={StarlineGameDetailScreen} />
          <Stack.Screen name="QRCodePaymentScreen" component={QRCodePaymentScreen} />


          {/* Starline Game Screens */}
          <Stack.Screen name="StarLineSingleDigitGame" component={StarLineSingleDigitGame} />
          <Stack.Screen name="StarLineSinglePanaGame" component={StarLineSinglePanaGame} />
          <Stack.Screen name="StarlineDoublePanaGame" component={StarlineDoublePanaGame} />
          <Stack.Screen name="StarlineTriplePanaGame" component={StarlineTriplePanaGame} />
          <Stack.Screen name="StarlineSPDPTPGame" component={StarlineSPDPTPGame} />
          <Stack.Screen name="StarlineSPMotorGame" component={StarlineSPMotorGame} />
          <Stack.Screen name="StarLineDPMotorGame" component={StarLineDPMotorGame} />
          <Stack.Screen name="StarlineEvenOddGame" component={StarlineEvenOddGame} />

          {/* js jackpot screen */}
          <Stack.Screen name="JackpotGameDetailScreen" component={JackpotGameDetailScreen} />
          <Stack.Screen name="PSJackpotScreen" component={PSJackpotScreen} />
          <Stack.Screen name="JackpotSingleGame" component={JackpotSingleGame} />
          <Stack.Screen name="JackpotJodiGame" component={JackpotJodiGame} />


          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />

          <Stack.Screen name="NoticeBoard" component={NoticeBoardScreen} />
          <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="BidHistory" component={BidHistoryScreen} />
          <Stack.Screen name="AddFundHistory" component={AddFundHistoryScreen} />
          <Stack.Screen name="WithdrawFundHistory" component={WithdrawFundHistoryScreen} />
          <Stack.Screen name="UpdateBankDetails" component={UpdateBankDetailsScreen} />
          <Stack.Screen name="MyProfile" component={MyProfileScreen} />
          <Stack.Screen name="MpinScreen" component={MpinScreen} />
          <Stack.Screen name="PSStarlineResultHistory" component={PSStarlineResultScreen} />
          <Stack.Screen name="psJackpotResultHistory" component={PSjackpotResultScreen} />


          <Stack.Screen name="Charts" component={ChartsScreen} />
          <Stack.Screen name="ChartsList" component={MatkaChartsListScreen} />
          <Stack.Screen name="StarlineChart" component={StarlineChart} />
          <Stack.Screen name="JackpotChart" component={JackpotChartListScreen} />
          <Stack.Screen name="JodiChart" component={JodiChartScreen} />
          <Stack.Screen name="PanelChart" component={PanelChartScreen} />

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

/**
 * Function to request permissions and get the FCM Device Token
 */
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission not granted!');
      return;
    }

    // Get the direct FCM token (Device Push Token)
    try {
      token = (await Notifications.getDevicePushTokenAsync()).data;
    } catch (e) {
      console.error("Error getting Device Push Token:", e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
