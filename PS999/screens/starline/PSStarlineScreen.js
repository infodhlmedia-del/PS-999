import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
  Image,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import CustomLoader from '../../components/CustomLoader';

import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, starlinegetMarkets, getStarlineResults, sarline } from '../../api/auth';

const PSStarlineScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0.0);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [rates, setRates] = useState(null);
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

        // Fetch Starline Markets
        const marketRes = await starlinegetMarkets();
        if (marketRes && marketRes.status === true && marketRes.data) {
          const marketsWithResults = await Promise.all(marketRes.data.map(async (market) => {
            try {
              const resultRes = await getStarlineResults(market.id);
              let resultStr = "*** - *";
              if (resultRes && resultRes.status === "success" && resultRes.data && resultRes.data.length > 0) {
                const latestResult = resultRes.data[0];
                if (latestResult.open_number !== "-" && latestResult.last_digit_open !== "-") {
                  resultStr = `${latestResult.open_number} - ${latestResult.last_digit_open}`;
                }
              }
              return { ...market, resultStr };
            } catch (e) {
              return { ...market, resultStr: "*** - *" };
            }
          }));
          setMarkets(marketsWithResults);
        }

        // Fetch Game Rates using the new sarline API
        try {
          const ratesRes = await sarline();
          if (ratesRes && ratesRes.status === true && ratesRes.data && ratesRes.data.length > 0) {
            setRates(ratesRes.data[0]);
          }
        } catch (e) {
          console.error('Error fetching starline game rates:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching starline data:', error);
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

  const toggleNotification = () => setIsNotificationEnabled(previousState => !previousState);

  const formatRate = (val) => {
    return (val === undefined || val === null || val === "") ? "-" : val.toString();
  };

  const renderGameRateCard = (title, rate) => (
    <View style={styles.rateCard}>
      <Text style={styles.rateTitle}>{title}</Text>
      <Text style={styles.rateValue}>{rate}</Text>
    </View>
  );

  const isMarketOpen = (market) => {
    if (market.market_status !== "1") return false;

    try {
      const [hours, minutes] = market.end_time.split(':').map(Number);
      const now = new Date();
      const endTime = new Date();
      endTime.setHours(hours, minutes, 0, 0);

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
    const marketTime = market.end_time_12 || market.market_name;

    return (
      <View key={market.id} style={styles.marketCard}>
        <View style={styles.marketInfo}>
          <Text style={styles.marketTime}>{marketTime}</Text>
          <Text style={[styles.marketStatus, { color: statusColor }]}>{statusText}</Text>
        </View>

        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{market.resultStr}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.playButton, !isActuallyOpen && styles.playButtonDisabled]}
            onPress={() => {
              if (isActuallyOpen) {
                console.log('PSStarlineScreen: Navigating to Detail with ID:', market.id, 'Name:', market.market_name, 'Time:', market.end_time_12);
                navigation.navigate('StarlineGameDetail', {
                  gameName: market.market_name,
                  gameId: market.id,
                  gameCode: market.api_game_id,
                  sessionTime: market.end_time_12
                });
              }
            }}
          >
            <Text style={[styles.playButtonText, { color: isActuallyOpen ? "#333" : "#999" }]}>Play Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PS STARLINE DASHBOARD</Text>
        <View style={styles.balancePill}>
          <Text style={styles.balanceIcon}>₹</Text>
          <Text style={styles.balanceText}>{balance.toFixed(1)}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
        <View style={styles.controlsRow}>
          <View />
          <View style={styles.notificationControl}>
            <Text style={styles.controlText}>Notification</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#2E5B3D" }}
              thumbColor={isNotificationEnabled ? "#fff" : "#f4f3f4"}
              onValueChange={toggleNotification}
              value={isNotificationEnabled}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>

        {/* Displaying only 4 requested game rates */}
        <View style={styles.rateGrid}>
          <View style={styles.rateRow}>
            {renderGameRateCard("Single Digit", rates ? formatRate(rates.single_digit) : "-")}
            {renderGameRateCard("Double Pana", rates ? formatRate(rates.double_panna) : "-")}
          </View>
          <View style={styles.rateRow}>
            {renderGameRateCard("Single Pana", rates ? formatRate(rates.single_panna) : "-")}
            {renderGameRateCard("Triple Pana", rates ? formatRate(rates.tripple_panna) : "-")}
          </View>
        </View>

        {loading ? (
          <View style={{ height: 100 }} />
        ) : (
          markets.map(renderMarketCard)
        )}
        <CustomLoader visible={loading} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDE0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 45,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#000',
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C85C73',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
    minWidth: 75,
    justifyContent: 'center',
  },
  balanceIcon: {
    color: '#fff',
    marginRight: 4,
    fontWeight: 'bold',
  },
  balanceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  notificationControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlText: {
    fontSize: 16,
    color: '#8D8D8D',
    marginLeft: 8,
  },
  rateGrid: {
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    margin: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rateTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  rateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C85C73',
  },
  marketCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 12,
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  marketInfo: {
    flex: 1,
  },
  marketTime: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#000',
  },
  marketStatus: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  resultContainer: {
    backgroundColor: '#000',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  resultText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#A0A0A0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  playButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#eee',
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PSStarlineScreen;
