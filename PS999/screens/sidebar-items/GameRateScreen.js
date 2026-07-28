import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMarketRate, getJackPot, sarline } from '../../api/auth';

const RateCard = ({ title, rate }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardText}>
        {title}: <Text style={styles.rateText}>{rate || '-'}</Text>
      </Text>
    </View>
  );
};

const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

export default function GameRateScreen({ navigation }) {
  const [regularRates, setRegularRates] = useState(null);
  const [jackpotRates, setJackpotRates] = useState(null);
  const [starlineRates, setStarlineRates] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, jackRes, starRes] = await Promise.all([
        getMarketRate().catch(e => { console.error("Reg Error", e); return null; }),
        getJackPot().catch(e => { console.error("Jackpot Error", e); return null; }),
        sarline().catch(e => { console.error("Starline Error", e); return null; }),
      ]);

      if (regRes?.status && regRes?.data?.length > 0) {
        setRegularRates(regRes.data[0]);
      }
      if (jackRes?.status && jackRes?.data?.length > 0) {
        setJackpotRates(jackRes.data[0]);
      }
      if (starRes?.status && starRes?.data?.length > 0) {
        setStarlineRates(starRes.data[0]);
      }
    } catch (error) {
      console.error("Critical error in fetchData:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#C36578" />
          <Text style={{ marginTop: 10, color: '#666' }}>Fetching rates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatRaw = (val) => {
    return (val === undefined || val === null || val === "") ? "-" : val.toString();
  };

  const renderMarketSection = (title, rates) => {
    if (!rates) return <Text style={styles.noData}>No {title.toLowerCase()} available</Text>;

    return (
      <>
        <SectionHeader title={title} />
        <RateCard title="SINGLE DIGIT" rate={formatRaw(rates.single_digit)} />
        <RateCard title="JODI" rate={formatRaw(rates.jodi)} />
        <RateCard title="SINGLE PANNA" rate={formatRaw(rates.single_panna)} />
        <RateCard title="DOUBLE PANNA" rate={formatRaw(rates.double_panna)} />
        <RateCard title="TRIPLE PANNA" rate={formatRaw(rates.tripple_panna)} />
        <RateCard title="HALF SANGAM" rate={formatRaw(rates.half_sangam)} />
        <RateCard title="FULL SANGAM" rate={formatRaw(rates.full_sangam)} />
        <RateCard title="SP MOTOR" rate={formatRaw(rates.sp_motor)} />
        <RateCard title="DP MOTOR" rate={formatRaw(rates.dp_motor)} />
        <RateCard title="SP DP TP" rate={formatRaw(rates.sp_dp_tp)} />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Game Rate</Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshBadge}>
          <Ionicons name="refresh" size={20} color="#C36578" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Regular Games Section */}
        {renderMarketSection("Regular Market Rates", regularRates)}

        {/* Starline Games Section */}
        {renderMarketSection("Starline Market Rates", starlineRates)}

        {/* Jackpot Games Section */}
        {renderMarketSection("Jackpot Market Rates", jackpotRates)}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDE0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
    paddingBottom: 15,
    justifyContent: 'space-between'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  sectionHeader: {
    backgroundColor: '#C36578',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.0,
  },
  cardText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  rateText: {
    fontWeight: 'bold',
    color: '#000',
  },
  refreshBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5EDE0',
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic'
  }
});
