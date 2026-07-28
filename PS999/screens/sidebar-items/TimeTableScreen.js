import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TimeTableScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Time Table</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>Time Table</Text>
        <Text style={styles.subText}>Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5EDE0' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: 40,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', fontFamily: 'Poppins_600SemiBold' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#000', fontWeight: 'bold', fontFamily: 'Poppins_600SemiBold' },
  subText: { fontSize: 16, color: '#666', marginTop: 10, fontFamily: 'Poppins_600SemiBold' },
});
