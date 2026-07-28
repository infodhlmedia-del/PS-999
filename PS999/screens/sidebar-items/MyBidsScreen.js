import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MyBidsScreen({ navigation }) {
  const bidOptions = [
    {
      id: 1,
      title: 'Bid History',
      subtitle: 'You can view your market bid history',
      icon: 'calendar-month',
      type: 'MaterialCommunityIcons'
    },
    {
      id: 2,
      title: 'Game Results',
      subtitle: 'You can view your market result history',
      icon: 'history',
      type: 'MaterialIcons'
    },
   
    {
      id: 3,
      title: 'PS Starline Result History',
      subtitle: 'You can view starline result',
      icon: 'clock-outline',
      type: 'MaterialCommunityIcons'
    },
   
    {
      id: 4,
      title: 'PS Jackpot Result History',
      subtitle: 'You can view Jackpot result',
      icon: 'clock-outline',
      type: 'MaterialCommunityIcons'
    },
  ];

  const IconComp = ({ name, type }) => {
    if (type === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={name} size={30} color="#FFC107" />;
    if (type === 'MaterialIcons') return <MaterialIcons name={name} size={30} color="#FFC107" />;
    return <Ionicons name={name} size={30} color="#FFC107" />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2e3caff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Ionicons name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bids</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {bidOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            activeOpacity={0.8}
            onPress={() => {
              if (option.id === 1) {
                navigation.navigate('BidHistory');
              }
              if (option.id === 2) {
                navigation.navigate('GameResults');
              }
              if (option.id === 3) {
                navigation.navigate('PSStarlineResultHistory');
              }
              if (option.id === 4) {
                navigation.navigate('psJackpotResultHistory')
              }
            }}
          >
            <View style={styles.iconContainer}>
              <IconComp name={option.icon} type={option.type} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={20} color="#6B3A3A" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2e3caff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButtonContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f2e3caff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    // Elevation for Android
    elevation: 4,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 24,
    color: '#000',
    fontFamily: 'Roboto_700Bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6B3A3A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Roboto_700Bold',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  chevronContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5EDE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
