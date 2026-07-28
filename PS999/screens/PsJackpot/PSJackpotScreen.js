import React, { useState, useRef, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, psJackpotMarket, psJackpotResult, getJackPot } from '../../api/auth';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  Animated,
  Easing,
  Dimensions,
  RefreshControl,
} from 'react-native';
import CustomLoader from '../../components/CustomLoader';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Custom Marquee Component
const MarqueeText = ({ text, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const containerWidth = SCREEN_WIDTH - 180;

  useEffect(() => {
    if (textWidth > 0) {
      const startAnimation = () => {
        animatedValue.setValue(containerWidth);
        Animated.loop(
          Animated.timing(animatedValue, {
            toValue: -textWidth,
            duration: 8000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      };
      startAnimation();
    }
  }, [textWidth, containerWidth]);

  return (
    <View style={{ width: containerWidth, overflow: 'hidden', alignItems: 'center' }}>
      <Animated.Text
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        style={[style, { transform: [{ translateX: animatedValue }] }]}
        numberOfLines={1}
      >
        {text}   {text}   {text}
      </Animated.Text>
    </View>
  );
};

export default function PSJackpotScreen({ navigation }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  const [balance, setBalance] = useState(0.0);
  const [markets, setMarkets] = useState([]);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const mobile = await AsyncStorage.getItem('userMobile');
      const userId = await AsyncStorage.getItem('userId');

      if (mobile && userId) {
        // Fetch Balance
        const balanceRes = await getWalletBalance(mobile, userId);
        if (balanceRes && (balanceRes.status === true || balanceRes.status === 'true')) {
          setBalance(parseFloat(balanceRes.balance));
        }

        // Fetch Jackpot Markets
        const marketRes = await psJackpotMarket('1');
        if (marketRes && (marketRes.status === true || marketRes.status === 'true' || marketRes.status === 'success') && marketRes.data) {
          // Fetch results for each market
          const marketsWithResults = await Promise.all(marketRes.data.map(async (market) => {
            try {
              const resultRes = await psJackpotResult(market.id);
              let resultStr = "**";
              if (resultRes && (resultRes.status === 'success' || resultRes.status === true) && resultRes.data && resultRes.data.length > 0) {
                const latestResult = resultRes.data[0];
                if (latestResult.jodi && latestResult.jodi !== "-") {
                  resultStr = latestResult.jodi;
                } else if (latestResult.full_result && latestResult.full_result !== "-") {
                  resultStr = latestResult.full_result;
                } else if (latestResult.last_digit_close && latestResult.last_digit_close !== "-") {
                  resultStr = latestResult.last_digit_close;
                }
              }
              return { ...market, resultStr };
            } catch (e) {
              return { ...market, resultStr: "**" };
            }
          }));
          setMarkets(marketsWithResults);

          // Fetch Game Rates using the new getJackPot API
          try {
            const ratesRes = await getJackPot();
            if (ratesRes && ratesRes.status === true && ratesRes.data && ratesRes.data.length > 0) {
              setRates(ratesRes.data[0]);
            }
          } catch (e) {
            console.error('Error fetching jackpot game rates:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching jackpot data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const isMarketOpen = (market) => {
    if (market.market_status !== "1") return false;

    try {
      const [hours, minutes] = market.end_time.split(':').map(Number);
      const now = new Date();
      const endTime = new Date();
      endTime.setHours(hours, minutes, 0, 0);

      // Close 15 minutes before end_time
      const diffInMinutes = (endTime.getTime() - now.getTime()) / (1000 * 60);
      if (diffInMinutes <= 15) {
        return false;
      }
      return true;
    } catch (e) {
      return market.market_status === "1";
    }
  };

  const renderMarketCard = (market) => {
    const isActuallyOpen = isMarketOpen(market);
    const statusText = isActuallyOpen ? "Running Now" : "Close for today";
    const statusColor = isActuallyOpen ? "#4CAF50" : "#D32F2F";
    const marketTime = market.end_time_12 || market.market_name || market.time;

    return (
      <View key={market.id} style={styles.gameCard}>
        {/* Left: Time & Status */}
        <View style={styles.gameInfoLeft}>
          <Text style={styles.gameTime}>{marketTime}</Text>
          <Text style={[styles.gameStatus, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>

        {/* Center: Result Pill */}
        <View style={styles.resultPill}>
          <Text style={styles.resultText}>{market.resultStr || '**'}</Text>
        </View>

        {/* Right: Play Button */}
        <TouchableOpacity
          style={[styles.playButton, !isActuallyOpen && styles.playButtonDisabled]}
          onPress={() => {
            if (isActuallyOpen) {
              console.log('PSJackpot: Navigating to Detail with ID:', market.id, 'Name:', market.market_name);
              navigation.navigate('JackpotGameDetailScreen', {
                gameName: market.market_name,
                gameId: market.id,
                gameCode: market.api_game_id,
                sessionTime: market.end_time_12
              });
            }
          }}
        >
          <Text style={[styles.playButtonText, { color: isActuallyOpen ? '#333' : '#999' }]}>Play Game</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      {/* Fixed Header Section */}
      <View style={styles.fixedContent}>
        {/* Header with Back Button, Title, Balance */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <MarqueeText
            text="PS JACKPOT DASHBOARD"
            style={styles.headerTitle}
          />

          <View style={styles.balanceChip}>
            <Ionicons name="wallet-outline" size={16} color="#fff" />
            <Text style={styles.balanceText}>{balance.toFixed(1)}</Text>
          </View>
        </View>

        {/* Notification Row */}
        <View style={styles.topRow}>
          <View />
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationText}>Notification</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#1B5E20" }}
              thumbColor={isEnabled ? "#4CAF50" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleSwitch}
              value={isEnabled}
              style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
            />
          </View>
        </View>

        {/* Jodi Rate Display - Only showing Jodi as requested */}
        <View style={styles.rateContainer}>
          <View style={styles.jodiRateCard}>
            <Text style={styles.jodiLabel}>Jodi Rate</Text>
            <Text style={styles.jodiValue}>10 : {rates?.jodi || '1000'}</Text>
          </View>
        </View>
      </View>

      {/* Scrollable Game List */}
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={{ height: 100 }} />
          </View>
        ) : markets.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#999" />
            <Text style={styles.loadingText}>No markets available</Text>
          </View>
        ) : (
          <View style={styles.gamesParams}>
            {markets.map((market) => renderMarketCard(market))}
          </View>
        )}

        {/* Bottom padding for scroll */}
        <View style={{ height: 20 }} />
      </ScrollView>
      <CustomLoader visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDE0',
  },
  fixedContent: {
    backgroundColor: '#F5EDE0',
    paddingBottom: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#F5EDE0',
    gap: 8,
  },
  backButton: {
    padding: 0,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: 22,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0E6D8',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C85C73',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexShrink: 0,
    marginRight: 4,
    gap: 6,
    minWidth: 85,
    justifyContent: 'center',
  },
  balanceText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 16,
    color: '#8D8D8D',
    marginRight: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  rateContainer: {
    paddingHorizontal: 15,
    marginVertical: 5,
    alignItems: 'center',
  },
  jodiRateCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  jodiLabel: {
    fontSize: 17,
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  jodiValue: {
    fontSize: 18,
    color: '#C85C73',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 15,
  },
  gamesParams: {
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
    fontFamily: 'Poppins_600SemiBold',
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    gap: 8,
  },
  gameInfoLeft: {
    flex: 1,
    flexShrink: 1,
  },
  gameTime: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  gameStatus: {
    fontSize: 12,
    marginTop: 3,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '500',
  },
  resultPill: {
    backgroundColor: '#000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 55,
    alignItems: 'center',
    flexShrink: 0,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#A0A0A0',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexShrink: 0,
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
  playButtonText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
  },
});
