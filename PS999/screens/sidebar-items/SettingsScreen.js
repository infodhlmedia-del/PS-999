import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }) {
  const [gameNotification, setGameNotification] = useState(true);
  const [mainNotification, setMainNotification] = useState(true);
  const [psStarlineNotification, setPsStarlineNotification] = useState(true);
  const [psJackpotNotification, setPsJackpotNotification] = useState(true);

  const SettingItem = ({ label, value, onValueChange }) => (
    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        trackColor={{ false: '#D1D1D1', true: '#FFD700' }}
        thumbColor={value ? '#FFA500' : '#f4f3f4'}
        ios_backgroundColor="#D1D1D1"
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setting</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Notification Settings Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Notification Setting</Text>
          </View>

          <View style={styles.settingsContainer}>
            <SettingItem
              label="Game Notification:"
              value={gameNotification}
              onValueChange={setGameNotification}
            />
            <SettingItem
              label="Main Notification:"
              value={mainNotification}
              onValueChange={setMainNotification}
            />
            <SettingItem
              label="PS Starline Notification"
              value={psStarlineNotification}
              onValueChange={setPsStarlineNotification}
            />
            <SettingItem
              label="PS JackPot Notification"
              value={psJackpotNotification}
              onValueChange={setPsJackpotNotification}
            />
          </View>
        </View>
      </View>
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
    paddingVertical: 15,
    paddingTop: 45,
    backgroundColor: '#F5EDE0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    backgroundColor: '#C36578',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
    fontStyle: 'italic',
  },
  settingsContainer: {
    backgroundColor: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
  },
});
