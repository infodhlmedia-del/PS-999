import React, { useState, useRef, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, getDateTime, getMarkets, AdminContactDetailes } from '../api/auth';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  Linking,
  Animated,
  Dimensions,
  Easing,
  Share,
  Image,
  RefreshControl,
  Alert,
  BackHandler
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8; // 80% screen width

import Sidebar from '../components/Sidebar';
import CustomLoader from '../components/CustomLoader';
import ExitModal from '../components/ExitModal';

//home
export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [balance, setBalance] = useState(0.0);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [serverTime, setServerTime] = useState({
    date: '',
    time: '',
    day: ''
  });
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    date: ''
  });

  const [gamesList, setGamesList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [adminContacts, setAdminContacts] = useState({
    call: '1234567890',
    whatsapp: '1234567890'
  });

  const fetchBalance = async () => {
    // console.log('HomeScreen: fetchBalance started');
    try {
      // Fetch Server Time
      // console.log('HomeScreen: Fetching server time...');
      const timeData = await getDateTime();
      // console.log('HomeScreen: Server time response:', timeData);
      if (timeData && timeData.status === true) {
        setServerTime({
          date: timeData.date,
          time: timeData.time_12,
          day: timeData.day
        });
      }

      // Fetch Contacts
      const contactsResponse = await AdminContactDetailes();
      if (contactsResponse && contactsResponse.status && contactsResponse.data) {
        setAdminContacts({
          call: contactsResponse.data.Call_Number || '1234567890',
          whatsapp: contactsResponse.data.Whatsapp || '1234567890',
          whatsappSupport: contactsResponse.data.Whatsapp_Support || '1234567890' 
        });
      }

      const mobile = await AsyncStorage.getItem('userMobile');
      const name = await AsyncStorage.getItem('userName');
      const date = await AsyncStorage.getItem('userDate');
      const userId = await AsyncStorage.getItem('userId');

      setUserData(prev => ({
        ...prev,
        name: name || 'User',
        phone: mobile || '',
        date: date || '03/01/2026'
      }));

      // console.log('HomeScreen: Stored mobile:', mobile, 'userId:', userId);
      if (mobile && userId) {
        const response = await getWalletBalance(mobile, userId);
        // console.log('HomeScreen: Balance response:', response);
        if (response && (response.status === true || response.status === 'true')) {
          const newBalance = parseFloat(response.balance);
          // console.log('HomeScreen: Setting balance to:', newBalance);
          setBalance(newBalance);
        } else {
          // console.log('HomeScreen: Balance status not true');
        }
      } else {
        // console.log('HomeScreen: No mobile number or user ID found');
      }

      // Fetch Markets
      // console.log('HomeScreen: Fetching markets...');
      const marketResponse = await getMarkets();
      // console.log('HomeScreen: Market response count:', marketResponse?.data?.length);

      if (marketResponse && marketResponse.status === true && marketResponse.data) {
        const currentTime = new Date();
        const serverDateStr = timeData?.date || currentTime.toISOString().split('T')[0];

        const transformedMarkets = marketResponse.data.map(market => {
          // Logic for isOpen: end_time - 30 minutes
          // end_time is in "HH:mm" format (e.g., "22:30")
          const [startH, startM] = market.start_time.split(':').map(Number);
          const [endH, endM] = market.end_time.split(':').map(Number);

          const marketStartDate = new Date(serverDateStr);
          marketStartDate.setHours(startH, startM, 0);

          const marketEndDate = new Date(serverDateStr);
          marketEndDate.setHours(endH, endM, 0);

          // Calculate midpoint time (for OPEN bidding cutoff)
          const midpointTime = new Date((marketStartDate.getTime() + marketEndDate.getTime()) / 2);

          // CLOSE bidding closes 30 mins before end_time
          const closeDate = new Date(marketEndDate.getTime() - 30 * 60000); // 30 mins before

          const isCurrentlyOpen = currentTime < closeDate && market.market_status === "1";

          // OPEN option available until midpoint time
          const isOpenAvailable = currentTime < midpointTime && market.market_status === "1";

          // CLOSE option available until 30 mins before end_time
          const isCloseAvailable = currentTime < closeDate && market.market_status === "1";

          return {
            id: market.id,
            name: market.market_name,
            code: '***-**-***',
            time: `${market.start_time_12} - ${market.end_time_12}`,
            status: isCurrentlyOpen ? 'Market is Running' : 'Closed for today',
            isOpen: isCurrentlyOpen,
            isOpenAvailable: isOpenAvailable,
            isCloseAvailable: isCloseAvailable,
            initials: market.market_name.substring(0, 2).toUpperCase()
          };
        });

        const sortedMarkets = transformedMarkets.sort((a, b) => {
          if (a.isOpen === b.isOpen) return 0;
          return a.isOpen ? 1 : -1;
        });

        setGamesList(sortedMarkets);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBalance();
  }, []);



  useFocusEffect(
    useCallback(() => {
      fetchBalance();

      const backAction = () => {
        setShowExitModal(true);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }, [])
  );

  const makeCall = () => {
    Linking.openURL(`tel:+91${adminContacts.call}`);
  };

  const openWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=+91${adminContacts.whatsapp}`);
  };

  const openSupportWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=+91${adminContacts.whatsappSupport}`);
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message: 'Download PS 999 App - Best Satta Matka App! Download now: https://dhlmedia.online/GoldenMatka/website',
        title: 'PS 999',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const openDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1b63a6" />
      <CustomLoader visible={refreshing} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 45) }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
          <Text style={styles.headerTitle}>PS 999</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('AddFund')} style={styles.balanceChip}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <Text style={styles.balanceText}>{balance.toFixed(1)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
            <Ionicons name="notifications" size={24} color="#1b63a6" style={styles.notificationIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Buttons */}
      <View style={styles.gameButtonsContainer}>
        <TouchableOpacity
          style={styles.gameButton}
          onPress={() => navigation.navigate('PSStarline')}
        >
          <View style={styles.iconCircle}>
            <MaterialIcons name="play-arrow" size={26} color="#000" />
          </View>
          <Text style={styles.gameButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} ellipsizeMode='tail'>King Starline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gameButton}
          onPress={() => navigation.navigate('PSJackpotScreen')}
        >
          <View style={styles.iconCircle}>
            <MaterialIcons name="play-arrow" size={26} color="#000" />
          </View>
          <Text style={styles.gameButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} ellipsizeMode='tail'>King Jackpot</Text>
        </TouchableOpacity>
      </View>

      {/* Action Wrapper Container */}
      <View style={styles.actionWrapper}>
        {/* Contact Buttons */}
        <View style={styles.contactContainer}>
          <TouchableOpacity style={styles.contactButton} onPress={makeCall}>
            <Image source={require('../assets/Home-Banner/call.png')} style={styles.contactIcon} />
            <Text style={styles.contactText}>{adminContacts.call}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButtonWhatsapp} onPress={openWhatsApp}>
            <Image source={require('../assets/Home-Banner/iwp.png')} style={styles.contactIcon} />
            <Text style={styles.contactText}>{adminContacts.whatsapp}</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.addMoneyButton}
            onPress={() => navigation.navigate('AddFund')}
          >
            <View style={styles.actionIconCircle}>
              <FontAwesome5 name="rupee-sign" size={20} color="#4CAF50" />
            </View>
            <Text style={styles.actionButtonText}>ADD MONEY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => navigation.navigate('WithdrawFund')}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="cash-outline" size={22} color="#D32F2F" />
            </View>
            <Text style={styles.actionButtonText}>WITHDRAW</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Games List */}
      <ScrollView
        style={styles.gamesList}
        overScrollMode="never"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
            progressViewOffset={-100}
            style={{ backgroundColor: 'transparent' }}
          />
        }
      >
        {gamesList.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.gameCard}
            onPress={() => {
              if (game.isOpen) {
                navigation.navigate('GameDetail', {
                  gameName: game.name,
                  gameCode: game.code,
                  isOpenAvailable: game.isOpenAvailable,
                  isCloseAvailable: game.isCloseAvailable
                });
              }
            }}
            activeOpacity={game.isOpen ? 0.7 : 1}
          >
            <View style={styles.gameIcon}>
              <Text style={styles.gameIconText}>{game.name.substring(0, 2)}</Text>
            </View>

            <View style={styles.gameInfo}>
              <Text style={styles.gameName} numberOfLines={1} adjustsFontSizeToFit>{game.name}</Text>
              <Text style={styles.gameCode}>{game.code}</Text>
              <Text style={[styles.gameStatus, { color: game.isOpen ? '#4CAF50' : '#D32F2F' }]}>
                {game.status}
              </Text>
              <Text style={styles.gameTime}>Timing: {game.time}</Text>
            </View>

            <View style={styles.gameActions}>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => {
                  setSelectedGame(game);
                  setInfoModalVisible(true);
                }}
              >
                <Ionicons name="information-circle-outline" size={24} color="#FFC107" />
              </TouchableOpacity>
              {game.isOpen ? (
                <View style={styles.playNowBadge}>
                  <Text style={styles.playNowText}>Play Now</Text>
                </View>
              ) : (
                <View style={styles.closedBadge}>
                  <Text style={styles.closedBadgeText}>Closed</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom + 5, 12) }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('MyBids')}
        >
          <Image source={require('../assets/footer-icons/bids_new.png')} style={[styles.navIcon, { tintColor: '#000000' }]} />
          <Text style={styles.navText}>My Bids</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Passbook')}
        >
          <Image source={require('../assets/footer-icons/passbook.png')} style={[styles.navIcon, { tintColor: '#000000' }]} />
          <Text style={styles.navText}>Passbook</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <View style={styles.homeCircle}>
            <Image source={require('../assets/footer-icons/home.png')} style={styles.homeIcon} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Funds')}
        >
          <Ionicons name="wallet-outline" size={24} color="#000000" />
          <Text style={styles.navText}>Funds</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={openSupportWhatsApp}>
          <Image source={require('../assets/footer-icons/chat_new.png')} style={[styles.navIcon, { tintColor: '#000000' }]} />
          <Text style={styles.navText}>Support</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Animated Drawer Component */}
      <Sidebar
        isVisible={drawerVisible}
        onClose={closeDrawer}
        userData={userData}
        navigation={navigation}
        shareApp={shareApp}
      />

      {/* Game Info Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={infoModalVisible}
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.infoModalOverlay}
          activeOpacity={1}
          onPress={() => setInfoModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.infoModalContent}
            onPress={() => { }}
          >
            {selectedGame && (
              <>
                <View style={styles.infoModalHeader}>
                  <Text style={styles.infoModalTitle}>{selectedGame.name}</Text>
                  <TouchableOpacity onPress={() => setInfoModalVisible(false)} style={styles.infoModalClose}>
                    <Ionicons name="close-circle" size={28} color="#ddd" />
                  </TouchableOpacity>
                </View>

                {/* Open Bid Time */}
                <View style={styles.timeRow}>
                  <View style={styles.timeLabelContainer}>
                    <Ionicons name="time-outline" size={22} color="#1b63a6" style={styles.timeIcon} />
                    <Text style={styles.timeLabel}>Open Bid Time</Text>
                  </View>
                  <Text style={styles.timeValue}>
                    {selectedGame.time ? selectedGame.time.split(' - ')[0] : '--:--'}
                  </Text>
                </View>

                {/* Close Bid Time */}
                <View style={styles.timeRow}>
                  <View style={styles.timeLabelContainer}>
                    <Ionicons name="time-outline" size={22} color="#1b63a6" style={styles.timeIcon} />
                    <Text style={styles.timeLabel}>Close Bid Time</Text>
                  </View>
                  <Text style={styles.timeValue}>
                    {selectedGame.time ? selectedGame.time.split(' - ')[1] : '--:--'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.infoModalOkButton}
                  onPress={() => setInfoModalVisible(false)}
                >
                  <Text style={styles.infoModalOkText}>OK</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <ExitModal 
        visible={showExitModal} 
        onClose={() => setShowExitModal(false)} 
        onConfirm={async () => {
          setShowExitModal(false);
          await AsyncStorage.multiRemove(['userName', 'userId', 'userDate']);
          BackHandler.exitApp();
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }, 100);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081d33',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: 45,
    backgroundColor: '#1b63a6',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
    fontFamily: 'Roboto_700Bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    marginRight: 10,
  },
  rupeeSymbol: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Roboto_700Bold',
    marginRight: 6,
  },
  balanceText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    letterSpacing: 1,
  },
  notificationIcon: {
    marginLeft: 5,
  },
  gameButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -3,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  gameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001228',
    paddingVertical: 8,
    borderRadius: 30,
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 18,
    height: 45,
    paddingHorizontal: 8,
    justifyContent: 'flex-start',
    paddingLeft: 2,
  },
  gameButtonText: {
    color: '#fff',
    fontSize: 16, // Reduced from 18 to fit better
    marginLeft: 10, // Reduced from 12
    fontFamily: 'Raleway_600SemiBold',
    flex: 1, // Added flex: 1 to ensure it stays in bounds
  },
  actionWrapper: {
    backgroundColor: '#0c1b30',
    marginHorizontal: 13,
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 24,
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: -5,
    marginBottom: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 30,
    marginRight: 7,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 24,
    height: 40,
    justifyContent: 'flex-start',
    paddingLeft: 2,
    paddingHorizontal: 15,
  },
  contactButtonWhatsapp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 30,
    marginLeft: 7,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 24,
    height: 40,
    justifyContent: 'flex-start',
    paddingLeft: 2,
    paddingHorizontal: 15,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: -5,
  },
  addMoneyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 30,
    marginRight: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 24,
    height: 40,
    justifyContent: 'flex-start',
    paddingLeft: 2,
    paddingHorizontal: 15,
  },
  withdrawButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingVertical: 8,
    borderRadius: 30,
    marginLeft: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 18,
    height: 40,
    justifyContent: 'flex-start',
    paddingLeft: 2,
    paddingHorizontal: 15,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontFamily: 'Roboto_700Bold',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 12,
  },
  contactIcon: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  gamesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  gameCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  gameIcon: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: '#001228',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameIconText: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Poppins_500Medium',
  },
  gameInfo: {
    flex: 1,
    marginLeft: 12,
  },
  gameName: {
    fontSize: 22,
    color: '#000000',
    fontFamily: 'Poppins_600SemiBold',
  },
  gameCode: {
    fontSize: 20,
    color: '#4CAF50',
    marginTop: -3,
    fontFamily: 'Poppins_500Medium',
  },
  gameStatus: {
    fontSize: 14,
    color: '#D32F2F',
    marginTop: 4,
    fontFamily: 'Poppins_500Medium',
  },
  gameTime: {
    fontSize: 12,
    color: '#000000ff',
    marginTop: 2,
    fontFamily: 'Poppins_500Medium',
  },
  gameActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  infoButton: {
  },
  closedBadge: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 25,
    marginTop: 10,
  },
  closedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Roboto_700Bold',
  },
  playNowBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 25,
    marginTop: 10,
  },
  playNowText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Roboto_700Bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {},
  homeCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#001228',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 15,
  },
  navText: {
    fontSize: 11,
    color: '#555555',
    marginTop: 4,
    fontFamily: 'sans-serif',
  },
  navIcon: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  homeIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    tintColor: '#fff',
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  infoModalTitle: {
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    color: '#000000',
    textAlign: 'center',
  },
  infoModalClose: {
    position: 'absolute',
    right: 0,
    top: -5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1b63a6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  timeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 10,
  },
  timeLabel: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Poppins_500Medium',
  },
  timeValue: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  infoModalOkButton: {
    backgroundColor: '#001228',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  infoModalOkText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    padding: 20,
    marginBottom: 20,
    fontFamily: 'Roboto_700Bold',
  },
});
