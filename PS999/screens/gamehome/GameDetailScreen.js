import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons} from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Custom Icon Component for circle icons with inner circle
const CircleIcon = ({ iconType, size = 30 }) => {
  const renderIcon = () => {
    switch (iconType) {
      case 'single-digit':
        // Single dot in circle   F
        return (
          <View style={styles.iconInner}>
            <View style={[styles.dot, { width: 14, height: 14, borderRadius: 7 }]} />
          </View>
        );

      case 'jodi':
        // Two dots  F
        return (
          <View style={[styles.iconInner, { flexDirection: 'row', gap: 6 }]}>
            <View style={[styles.dot, { width: 12, height: 12, borderRadius: 6 }]} />
            <View style={[styles.dot, { width: 12, height: 12, borderRadius: 6 }]} />
          </View>
        );

      case 'single-pana':
        // Card with plus  F
        return (
          <View style={styles.iconInner}>
            <View style={styles.cardIcon}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </View>
        );

      case 'double-pana':
        // Two cards overlapping  F
        return (
          <View style={[styles.iconInner, { flexDirection: 'row' }]}>
            <View style={[styles.cardPlain, { marginRight: -8 }]} />
            <View style={styles.cardPlain} />
          </View>
        );

      case 'triple-pana':
        // Asterisk/star  F
        return (
          <View style={styles.iconInner}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>✲</Text>
          </View>
        );
      case 'full-sangam':
        // 3x3 dots grid  F
        return (
          <View style={styles.iconInner}>
            <View style={styles.dotGrid}>
              {[...Array(9)].map((_, i) => (
                <View key={i} style={styles.gridDot} />
              ))}
            </View>
          </View>
        );
      case 'half-sangam':
        // 2x3 dots grid  F
        return (
          <View style={styles.iconInner}>
            <View style={[styles.dotGrid, { width: 32 }]}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.gridDot} />
              ))}
            </View>
          </View>
        );

      case 'sp-dp-tp':
        // Connected squares  F
        return (
          <View style={styles.iconInner}>
            <View style={styles.connectedSquares}>
              <View style={styles.squareTop} />
              <View style={styles.squaresBottom}>
                <View style={styles.squareSmall} />
                <View style={styles.squareSmall} />
              </View>
            </View>
          </View>
        );

      case 'sp-motor':
        // Circular arrows  F
        return (
          <View style={styles.iconInner}>
            <View style={styles.motorIcon}>
              <View style={styles.motorRing} />
            </View>
          </View>
        );
      case 'dp-motor':
        // Two concentric circles  F
        return (
          <View style={styles.iconInner}>
            <View style={styles.concentricOuter}>
              <View style={styles.concentricInner} />
            </View>
          </View>
        );

      case 'red-jodi':
        // Two dots horizontal   F
        return (
          <View style={[styles.iconInner, { flexDirection: 'row', gap: 8 }]}>
            <View style={[styles.dot, { width: 10, height: 10, borderRadius: 5 }]} />
            <View style={[styles.dot, { width: 10, height: 10, borderRadius: 5 }]} />
          </View>
        );
      case 'odd-even':
        // Hexagon pattern    F
        return (
          <View style={styles.iconInner}>
            <View style={styles.hexGrid}>
              <View style={styles.hexDot} />
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <View style={styles.hexDot} />
                <View style={styles.hexDot} />
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <View style={styles.hexDot} />
                <View style={styles.hexDot} />
                <View style={styles.hexDot} />
              </View>
            </View>
          </View>
        );
      default:
        return <Ionicons name="help-circle" size={size} color="#fff" />;
    }
  };

  return renderIcon();
};

export default function GameDetailScreen({ navigation, route }) {
  const { gameName, gameCode, isOpenAvailable, isCloseAvailable, marketType } = route.params;

  const gameTypes = [
    { id: 1, name: 'Single Digit', iconType: 'single-digit', screen: 'SingleDigitGame' },
    { id: 2, name: 'Jodi', iconType: 'jodi', screen: 'JodiGame' },
    { id: 3, name: 'Single Pana', iconType: 'single-pana', screen: 'SinglePanaGame' },
    { id: 4, name: 'Double Pana', iconType: 'double-pana', screen: 'DoublePanaGame' },
    { id: 5, name: 'Triple Pana', iconType: 'triple-pana', screen: 'TriplePanaGame' },
    { id: 6, name: 'Full Sangam', iconType: 'full-sangam', screen: 'FullSangamGame' },
    { id: 7, name: 'Half Sangam (A)', iconType: 'half-sangam', screen: 'HalfSangamAGame' },
    { id: 8, name: 'Half Sangam (B)', iconType: 'half-sangam', screen: 'HalfSangamBGame' },
    { id: 9, name: 'SP DP TP', iconType: 'sp-dp-tp', screen: 'SPDPTPGame' },
    { id: 10, name: 'SP Motor', iconType: 'sp-motor', screen: 'SPMotorGame' },
    { id: 11, name: 'DP Motor', iconType: 'dp-motor', screen: 'DPMotorGame' },
    { id: 12, name: 'Red Jodi', iconType: 'red-jodi', screen: 'RedJodiGame' },
    { id: 13, name: 'Odd Even', iconType: 'odd-even', screen: 'OddEvenGame' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{gameName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {gameTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={styles.gameTypeCard}
              onPress={() => navigation.navigate(type.screen, {
                gameName,
                gameCode,
                gameType: type.name,
                isOpenAvailable,
                isCloseAvailable
              })}
            >
              <View style={styles.iconCircle}>
                <CircleIcon iconType={type.iconType} />
              </View>
              <Text style={styles.gameTypeName}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 60,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameTypeCard: {
    width: (SCREEN_WIDTH - 36) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#C36578',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameTypeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  // Icon inner styles
  iconInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: '#fff',
  },
  ringOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  ringSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringSmallInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  cardIcon: {
    width: 24,
    height: 30,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSmall: {
    width: 20,
    height: 26,
    borderRadius: 3,
  },
  cardPlain: {
    width: 18,
    height: 24,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  plusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dotGrid: {
    width: 38,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
  },
  gridDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  boxedCard: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconSmall: {
    width: 16,
    height: 20,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedSquares: {
    alignItems: 'center',
  },
  squareTop: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 3,
    marginBottom: 4,
  },
  squaresBottom: {
    flexDirection: 'row',
    gap: 6,
  },
  squareSmall: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 2,
  },
  motorIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  motorRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    borderTopColor: 'transparent',
  },
  concentricOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  concentricInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  hexGrid: {
    alignItems: 'center',
    gap: 2,
  },
  hexDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
