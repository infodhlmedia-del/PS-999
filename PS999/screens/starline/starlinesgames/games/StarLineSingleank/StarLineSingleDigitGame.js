import React, { useState, useRef, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, starlinegetMarkets, starlineSingleDigit } from '../../../../../api/auth';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Modal,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../../../../components/CustomAlert';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Custom Marquee Component
const MarqueeText = ({ text, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const containerWidth = SCREEN_WIDTH - 140;

  useEffect(() => {
    if (textWidth > 0) {
      animatedValue.setValue(containerWidth);
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: -textWidth,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
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


export default function StarLineSingleDigitGame({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { gameName, gameCode, gameId, sessionTime, isOpenAvailable = true, isCloseAvailable = true } = route.params || {};
  const [marketId, setMarketId] = useState(gameId || null);
  const [mode, setMode] = useState('easy'); // 'easy' or 'special'

  // Filter game options based on availability
  const gameOptions = [
    ...(isOpenAvailable ? ['OPEN'] : []),
    ...(isCloseAvailable ? ['CLOSE'] : [])
  ];

  // Default to first available option
  const [selectedGame, setSelectedGame] = useState(gameOptions[0] || 'CLOSE');
  const [showDropdown, setShowDropdown] = useState(false);
  const [ank, setAnk] = useState('');
  const [points, setPoints] = useState('');
  const [bids, setBids] = useState([]);
  const [totalBids, setTotalBids] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [balance, setBalance] = useState(0.0);
  const [specialBids, setSpecialBids] = useState(Array(10).fill(''));
  const [currentDate, setCurrentDate] = useState('23-01-2026'); // Based on screenshot
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });


  const fetchBalance = async () => {
    try {
      const mobile = await AsyncStorage.getItem('userMobile');
      const userId = await AsyncStorage.getItem('userId');
      if (mobile && userId) {
        const response = await getWalletBalance(mobile, userId);
        if (response && (response.status === true || response.status === 'true')) {
          setBalance(parseFloat(response.balance));
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchMarketId = async () => {
    if (marketId) return;
    try {
      console.log('SingleDigit Game: Fetching markets for gameName:', gameName);
      const response = await starlinegetMarkets();
      if (response && response.status === true) {
        // console.log('SingleDigit Game: Found', response.data?.length, 'markets');

        // Log the first few markets to see structure
        if (response.data && response.data.length > 0) {
          // console.log('SingleDigit Game: Sample market data:', JSON.stringify(response.data[0]));
        }

        // Search by market_name or name or end_time (sometimes used as name)
        const currentMarket = response.data.find(m => {
          const mName = (m.market_name || m.name || '').trim().toLowerCase();
          const target = gameName.trim().toLowerCase();
          return mName === target || mName.includes(target) || target.includes(mName);
        });

        if (currentMarket) {
          setMarketId(currentMarket.id);
          // console.log('SingleDigit Game: Market ID found via robust search:', currentMarket.id, 'for name:', currentMarket.market_name);
        } else {
          console.warn('SingleDigit Game: Market not found for gameName:', gameName);
          // Log all names for debugging
          // console.log('SingleDigit Game: Available market names:', response.data.map(m => m.market_name || m.name).join(', '));
        }
      }
    } catch (error) {
      console.error('SingleDigit Game: Error fetching markets:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBalance();
      fetchMarketId();
    }, [])
  );


  const addBid = () => {
    if (ank && points) {
      const newBid = {
        id: Date.now(),
        ank: ank,
        point: points,
        type: selectedGame,
      };
      setBids([...bids, newBid]);
      setTotalBids(totalBids + 1);
      setTotalPoints(totalPoints + parseInt(points));
      setAnk('');
      setPoints('');
      setPoints('');
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please enter Ank and Points',
        type: 'error'
      });
    }

  };

  const deleteBid = (id) => {
    const bidToDelete = bids.find(b => b.id === id);
    setBids(bids.filter(b => b.id !== id));
    setTotalBids(totalBids - 1);
    setTotalPoints(totalPoints - parseInt(bidToDelete.point));
  };

  const handleSubmit = () => {
    let finalBids = [...bids];

    if (mode === 'special') {
      const bidsToAdd = specialBids
        .map((point, index) => ({ ank: index.toString(), point }))
        .filter((b) => b.point !== '');

      if (bidsToAdd.length > 0) {
        const newBids = bidsToAdd.map((b) => ({
          id: Date.now() + Math.random(),
          ank: b.ank,
          point: b.point,
          type: selectedGame,
        }));
        finalBids = [...finalBids, ...newBids];
        setBids(finalBids);
        setTotalBids(finalBids.length);
        const newTotalPoints = finalBids.reduce((sum, b) => sum + (parseInt(b.point) || 0), 0);
        setTotalPoints(newTotalPoints);
        setSpecialBids(Array(10).fill(''));
      }
    }

    if (finalBids.length > 0) {
      setShowConfirmModal(true);
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please add at least one bid',
        type: 'error'
      });
    }

  };

  const finalSubmit = async () => {
    setShowConfirmModal(false);
    try {
      console.log('SingleDigitGame: finalSubmit called. marketId:', marketId);
      const userId = await AsyncStorage.getItem('userId');
      const username = await AsyncStorage.getItem('userName') || await AsyncStorage.getItem('userMobile');

      if (!userId) {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: 'User ID missing. Please relogin.',
          type: 'error'
        });
        return;
      }

      if (!marketId) {
        console.log('SingleDigitGame: marketId missing, attempting one final lookup...');
        // Try to fetch it again as a last resort
        const markets = await starlinegetMarkets();
        if (markets && markets.data) {
          const target = gameName.trim().toLowerCase();
          const currentMarket = markets.data.find(m => {
            const mName = (m.market_name || m.name || '').trim().toLowerCase();
            return mName === target || mName.includes(target) || target.includes(mName);
          });
          if (currentMarket) {
            console.log('SingleDigitGame: Last resort lookup successful. ID:', currentMarket.id);
            setMarketId(currentMarket.id);
            // Continue with this ID
            await submitWithId(userId, username, currentMarket.id);
            return;
          }
        }

        setAlertConfig({
          visible: true,
          title: 'Error',
          message: 'Market ID missing. Please go back and try again.',
          type: 'error'
        });
        return;
      }

      await submitWithId(userId, username, marketId);
    } catch (error) {
      console.error('Bid Submission Error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Network request failed: ' + error.message,
        type: 'error'
      });
    }
  };

  const submitWithId = async (userId, username, currentMarketId) => {
    try {
      const numbers = bids.map(b => String(b.ank));
      const amounts = bids.map(b => String(b.point));

      console.log('SingleDigitGame: Submitting bids to starlineSingleDigit. Payload:', {
        userId, username, numbers, amounts, gameName, currentMarketId, sessionTime
      });
      const response = await starlineSingleDigit(
        userId,
        username,
        numbers,
        amounts,
        gameName,
        String(currentMarketId),
        "OPEN",
        sessionTime || gameName // Fallback to gameName if sessionTime missing
      );

      // console.log('SingleDigitGame: API Response:', JSON.stringify(response));

      if (response && (response.status === 'success' || response.status === true || response.status === 'true')) {
        setAlertConfig({
          visible: true,
          title: 'Success',
          message: response.message || 'Bids placed successfully!',
          type: 'success'
        });
        setBids([]);
        setTotalBids(0);
        setTotalPoints(0);
        setSpecialBids(Array(10).fill(''));
        fetchBalance();
      } else {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: response?.message || 'Failed to place bids.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Bid Submission Error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Network request failed',
        type: 'error'
      });
    }
  };

  const displayTotalBids = bids.length + (mode === 'special' ? specialBids.filter(b => b !== '').length : 0);
  const displayTotalPoints = bids.reduce((sum, b) => sum + (parseInt(b.point) || 0), 0) +
    (mode === 'special' ? specialBids.reduce((sum, b) => sum + (parseInt(b) || 0), 0) : 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <MarqueeText text={`${gameName} - SINGLE DIGIT`} style={styles.headerTitle} />
        <View style={styles.balanceChip}>
          <Ionicons name="wallet" size={16} color="#fff" />
          <Text style={styles.balanceText}>{balance.toFixed(1)}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Mode Toggle */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'easy' && styles.modeButtonActive]}
            onPress={() => setMode('easy')}
          >
            <Text style={[styles.modeText, mode === 'easy' && styles.modeTextActive]}>
              EASY MODE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'special' && styles.modeButtonActive]}
            onPress={() => setMode('special')}
          >
            <Text style={[styles.modeText, mode === 'special' && styles.modeTextActive]}>
              SPECIAL MODE
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'special' ? (
          <View style={styles.specialContainer}>
            {/* Pill Selectors */}
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Ionicons name="calendar-outline" size={20} color="#C36578" />
                <Text style={styles.pillText}>{currentDate}</Text>
              </View>
              <TouchableOpacity style={styles.pill} onPress={() => setShowDropdown(true)}>
                <Text style={styles.pillText}>{selectedGame}</Text>
                <Ionicons name="chevron-down" size={20} color="#C36578" style={styles.pillChevron} />
              </TouchableOpacity>
            </View>

            {/* Digit Grid */}
            <View style={styles.grid}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <View key={digit} style={styles.gridItem}>
                  <View style={styles.digitLabel}>
                    <Text style={styles.digitLabelText}>{digit}</Text>
                  </View>
                  <TextInput
                    style={styles.gridInput}
                    keyboardType="numeric"
                    placeholder=""
                    value={specialBids[digit]}
                    onChangeText={(text) => {
                      const newBids = [...specialBids];
                      newBids[digit] = text.replace(/[^0-9]/g, '');
                      setSpecialBids(newBids);
                    }}
                  />
                </View>
              ))}
            </View>


          </View>
        ) : (
          <>
            {/* Game Type Selector */}
            <View style={styles.row}>
              <Text style={styles.label}>Select Game Type:</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(true)}>
                <Text style={styles.dropdownText}>{selectedGame}</Text>
                <Ionicons name="chevron-down" size={20} color="#F5C542" />
              </TouchableOpacity>
            </View>

            {/* Ank Input */}
            <View style={styles.row}>
              <Text style={styles.label}>Enter Single Digit:</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Ank"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={1}
                value={ank}
                onChangeText={(text) => setAnk(text.replace(/[^0-9]/g, ''))}
              />
            </View>

            {/* Points Input */}
            <View style={styles.row}>
              <Text style={styles.label}>Enter Points:</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Point"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={points}
                onChangeText={(text) => setPoints(text.replace(/[^0-9]/g, ''))}
              />
            </View>

            {/* Add Button */}
            <TouchableOpacity style={styles.addButton} onPress={addBid}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Ank</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Point</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Type</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Delete</Text>
            </View>

            {/* Bids List */}
            {bids.map((bid) => (
              <View key={bid.id} style={styles.bidRow}>
                <Text style={[styles.bidText, { flex: 1 }]}>{bid.ank}</Text>
                <Text style={[styles.bidText, { flex: 1 }]}>{bid.point}</Text>
                <Text style={[styles.bidText, { flex: 1 }]}>{bid.type}</Text>
                <TouchableOpacity
                  style={{ flex: 1, alignItems: 'center' }}
                  onPress={() => deleteBid(bid.id)}
                >
                  <Ionicons name="trash" size={20} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Game Type Selection Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Game Type</Text>
            {gameOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  selectedGame === option && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setSelectedGame(option);
                  setShowDropdown(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedGame === option && styles.modalOptionTextSelected
                ]}>{option}</Text>
                {selectedGame === option && (
                  <Ionicons name="checkmark-circle" size={22} color="#2E4A3E" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: SCREEN_WIDTH * 0.9, maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Confirm Your Bids</Text>

            <View style={styles.confirmTableHeader}>
              <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Ank</Text>
              <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Points</Text>
              <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Type</Text>
            </View>

            <ScrollView style={{ marginVertical: 10 }}>
              {bids.map((bid) => (
                <View key={bid.id} style={styles.confirmBidRow}>
                  <Text style={[styles.confirmBidText, { flex: 1 }]}>{bid.ank}</Text>
                  <Text style={[styles.confirmBidText, { flex: 1 }]}>{bid.point}</Text>
                  <Text style={[styles.confirmBidText, { flex: 1 }]}>{bid.type}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.confirmTotalRow}>
              <Text style={styles.confirmTotalLabel}>Total Bids: {totalBids}</Text>
              <Text style={styles.confirmTotalLabel}>Total Points: {totalPoints}</Text>
            </View>

            <View style={styles.confirmButtonRow}>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: '#999' }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: '#C36578' }]}
                onPress={finalSubmit}
              >
                <Text style={styles.confirmButtonText}>Confirm Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Submit Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12), height: 75 + insets.bottom }]}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Bids</Text>
            <Text style={styles.statValue}>{displayTotalBids}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Points</Text>
            <Text style={styles.statValue}>{displayTotalPoints}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
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
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C36578',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  balanceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
    fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  modeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  modeButtonActive: {
    backgroundColor: '#C36578',
    borderColor: '#C36578',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Poppins_600SemiBold',
  },
  modeTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    fontFamily: 'Poppins_600SemiBold',
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  inputField: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  addButton: {
    backgroundColor: '#C36578',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#C36578',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C36578',
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  bidRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bidText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#EBDCCB',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_600SemiBold',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  submitButton: {
    backgroundColor: '#C36578',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 25,
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 320,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F5EDE0',
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  modalOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E4A3E',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
  },
  modalOptionTextSelected: {
    color: '#2E4A3E',
  },
  // Special Mode Styles
  specialContainer: {
    marginTop: 10,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pillText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginHorizontal: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  pillChevron: {
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    padding: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  gridItem: {
    width: '48%',
    flexDirection: 'row',
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  digitLabel: {
    width: 60,
    backgroundColor: '#C36578',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitLabelText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gridInput: {
    flex: 1,
    backgroundColor: '#D1D9E0',
    paddingHorizontal: 10,
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  specialSubmitButton: {
    backgroundColor: '#C36578',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  specialSubmitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  // Confirmation Modal Styles
  confirmTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#C36578',
    paddingVertical: 10,
    borderRadius: 5,
  },
  confirmHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  confirmBidRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  confirmBidText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  confirmTotalRow: {
    paddingVertical: 15,
    borderTopWidth: 2,
    borderTopColor: '#C36578',
    marginTop: 5,
  },
  confirmTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'right',
    marginBottom: 5,
  },
  confirmButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
