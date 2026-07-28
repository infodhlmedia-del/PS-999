import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, TriplePatti, getMarkets } from '../../../api/auth';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../../components/CustomAlert';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Triple Pana numbers (all same digits)
const TRIPLE_PANA_NUMBERS = ['000', '111', '222', '333', '444', '555', '666', '777', '888', '999'];

// Custom Marquee Component
const MarqueeText = ({ text, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const containerWidth = SCREEN_WIDTH - 140;

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

export default function TriplePanaGame({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(0.0);

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
    try {
      const response = await getMarkets();
      if (response && response.status === true) {
        const currentMarket = response.data.find(m => m.market_name === gameName);
        if (currentMarket) {
          setMarketId(currentMarket.id);
          console.log('TriplePana Game: Market ID found:', currentMarket.id);
        } else {
          console.warn('TriplePana Game: Market not found for gameName:', gameName);
        }
      }
    } catch (error) {
      console.error('TriplePana Game: Error fetching markets:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBalance();
      fetchMarketId();
    }, [])
  );


  const { gameName, gameType, isOpenAvailable = true, isCloseAvailable = true } = route.params || { gameName: 'TRIPLE PANA', gameType: 'open' };
  const [marketId, setMarketId] = useState(null);

  // Filter game options based on availability
  const gameOptions = [
    ...(isOpenAvailable ? ['OPEN'] : []),
    ...(isCloseAvailable ? ['CLOSE'] : [])
  ];

  const [selectedGameType, setSelectedGameType] = useState(gameOptions[0] || 'OPEN');
  const [showDropdown, setShowDropdown] = useState(false);
  const [panaInputs, setPanaInputs] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bids, setBids] = useState([]);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
    onClose: null
  });

  const [totalBids, setTotalBids] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  // Get current date in DD-MM-YYYY format
  const getCurrentDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Handle input change for a pana
  const handleInputChange = (pana, value) => {
    setPanaInputs(prev => ({
      ...prev,
      [pana]: value,
    }));
  };

  // Handle Submit
  const handleSubmit = () => {
    const newBids = [];
    Object.keys(panaInputs).forEach(pana => {
      const pointValue = panaInputs[pana];
      if (pointValue && parseInt(pointValue) > 0) {
        newBids.push({
          id: `${pana}-${Date.now()}-${Math.random()}`,
          pana: pana,
          point: pointValue,
          type: selectedGameType.toLowerCase(),
        });
      }
    });

    if (newBids.length === 0) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please enter points for at least one pana',
        type: 'error'
      });
      return;
    }


    const calculatedTotalPoints = newBids.reduce((sum, bid) => sum + parseInt(bid.point), 0);
    setBids(newBids);
    setTotalBids(newBids.length);
    setTotalPoints(calculatedTotalPoints);
    setShowConfirmModal(true);
  };

  const finalSubmit = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const username = await AsyncStorage.getItem('userName') || await AsyncStorage.getItem('userMobile');

      if (!userId || !marketId) {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: 'User ID or Market ID missing. Please restart app.',
          type: 'error'
        });
        return;
      }


      setShowConfirmModal(false);

      // Group bids by type (OPEN/CLOSE)
      const bidsByType = {};
      bids.forEach(bid => {
        if (!bidsByType[bid.type]) {
          bidsByType[bid.type] = [];
        }
        bidsByType[bid.type].push(bid);
      });

      let successCount = 0;
      const totalTypes = Object.keys(bidsByType).length;

      for (const type of Object.keys(bidsByType)) {
        const typeBids = bidsByType[type];
        const numbers = typeBids.map(b => b.pana);
        const amounts = typeBids.map(b => parseInt(b.point));

        const session = type.toUpperCase();

        // console.log(`Submitting Triple Patti Bids for ${session}:`, { userId, username, numbers, amounts, gameName, marketId, session });

        const response = await TriplePatti(userId, username, numbers, amounts, gameName, String(marketId), session);

        if (response && response.status === 'success') {
          successCount++;
        } else {
          setAlertConfig({
            visible: true,
            title: 'Error',
            message: `Failed to place ${session} bets: ${response?.message || 'Unknown error'}`,
            type: 'error'
          });
        }

      }

      if (successCount === totalTypes) {
        setAlertConfig({
          visible: true,
          title: 'Success',
          message: 'Bids Submitted Successfully!',
          type: 'success',
          onClose: () => {
            setPanaInputs({});
            setBids([]);
            setTotalBids(0);
            setTotalPoints(0);
            fetchBalance();
          }
        });
      }


    } catch (error) {
      console.error("Error submitting bids:", error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: "Network request failed",
        type: 'error'
      });
    }

  };

  const displayTotalBids = Object.keys(panaInputs).filter(k => panaInputs[k] && parseInt(panaInputs[k]) > 0).length;
  const displayTotalPoints = Object.values(panaInputs).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      {/* Header with Marquee */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <MarqueeText text={`${gameName} - TRIPLE PANA`} style={styles.headerTitle} />
        <View style={styles.balanceChip}>
          <Ionicons name="wallet" size={16} color="#fff" />
          <Text style={styles.balanceText}>{balance.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.staticContent}>
        {/* Date and Game Type Row */}
        <View style={styles.topRow}>
          <View style={styles.datePickerBtn}>
            <Ionicons name="calendar-outline" size={16} color="#C36578" />
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
          </View>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDropdown(true)}
          >
            <Text style={styles.dropdownText}>{selectedGameType}</Text>
            <Ionicons name="chevron-down" size={18} color="#B8860B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollableContent} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Triple Pana Grid */}
        <View style={styles.panaGrid}>
          {TRIPLE_PANA_NUMBERS.map((pana, index) => (
            <View key={pana} style={styles.panaItem}>
              <View style={styles.panaNumberBox}>
                <Text style={styles.panaNumberText}>{pana}</Text>
              </View>
              <TextInput
                style={styles.panaInput}
                placeholder=""
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={panaInputs[pana] || ''}
                onChangeText={(value) => handleInputChange(pana, value.replace(/[^0-9]/g, ''))}
              />
            </View>
          ))}
        </View>
      </ScrollView>

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
            <Text style={styles.modalTitle}>Select  Type</Text>
            {gameOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  selectedGameType === option && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setSelectedGameType(option);
                  setShowDropdown(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedGameType === option && styles.modalOptionTextSelected
                ]}>{option}</Text>
                {selectedGameType === option && (
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
              <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Pana</Text>
              <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Points</Text>
              <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Type</Text>
            </View>

            <ScrollView style={{ marginVertical: 10 }}>
              {bids.map((bid) => (
                <View key={bid.id} style={styles.confirmBidRow}>
                  <Text style={[styles.confirmBidText, { flex: 1 }]}>{bid.pana}</Text>
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

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.onClose) alertConfig.onClose();
        }}
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
  staticContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 150,
  },
  topRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#000',
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
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '500',
  },
  panaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  panaItem: {
    flexDirection: 'row',
    width: '48%',
    marginBottom: 12,
  },
  panaNumberBox: {
    backgroundColor: '#C36578',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    minWidth: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panaNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  panaInput: {
    flex: 1,
    backgroundColor: '#E0E8EE',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
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
    fontFamily: 'Poppins_600SemiBold',
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
    fontFamily: 'Poppins_600SemiBold',
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
    fontFamily: 'Poppins_600SemiBold',
  },
  confirmButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
});
