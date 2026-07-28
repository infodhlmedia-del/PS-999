import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FundsScreen({ navigation }) {
  const fundOptions = [
    {
      id: 1,
      title: 'Add Fund',
      subtitle: 'You can add fund to your wallet',
      icon: 'add-circle',
      screen: 'AddFund'
    },
    {
      id: 2,
      title: 'Withdraw Fund',
      subtitle: 'You can withdraw winnings',
      icon: 'cash',
      screen: 'WithdrawFund'
    },
    {
      id: 3,
      title: 'Bank Detail',
      subtitle: 'Add your bank detail for withdrawals',
      icon: 'business',
      screen: 'UpdateBankDetails'
    },
    {
      id: 4,
      title: 'Add Fund History',
      subtitle: 'You can check your add point history',
      icon: 'time',
      screen: 'AddFund'
    },
    {
      id: 5,
      title: 'Withdraw Fund History',
      subtitle: 'You can check your Withdraw point history',
      icon: 'refresh',
      screen: 'WithdrawFund'
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Funds</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {fundOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={() => option.screen && navigation.navigate(option.screen)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={option.icon} size={28} color="#fff" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#D4B5A5" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDE0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: 40,
    backgroundColor: '#F5EDE0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5D3A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
    fontFamily: 'Poppins_600SemiBold',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins_600SemiBold',
  },
});
