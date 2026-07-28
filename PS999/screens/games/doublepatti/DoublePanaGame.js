import React, { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, DoublePatti, getMarkets } from '../../../api/auth';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert from '../../../components/CustomAlert';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Double Pana numbers organized by their sum (add-ank)
const DOUBLE_PANA_NUMBERS = {
  0: ['550', '668', '244', '299', '226', '488', '677', '118', '334'],
  1: ['100', '119', '155', '227', '335', '344', '399', '588', '669'],
  2: ['200', '110', '228', '255', '336', '499', '660', '688', '778'],
  3: ['300', '166', '229', '337', '355', '445', '599', '779', '788'],
  4: ['400', '112', '220', '266', '338', '446', '455', '699', '770'],
  5: ['500', '113', '122', '177', '339', '366', '447', '556', '889'],
  6: ['600', '114', '277', '330', '448', '466', '556', '880', '899'],
  7: ['700', '115', '133', '188', '223', '377', '449', '557', '566'],
  8: ['800', '116', '224', '233', '288', '440', '477', '558', '990'],
  9: ['900', '117', '144', '199', '225', '667', '388', '559', '577'],
};

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

export default function DoublePanaGame({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { gameName, gameType, isOpenAvailable = true, isCloseAvailable = true } = route.params || { gameName: 'DOUBLE PANA', gameType: 'open' };
  const [mode, setMode] = useState('easy'); // 'easy' or 'special'
  const [marketId, setMarketId] = useState(null);

  // Filter game options based on availability
  const gameOptions = [
    ...(isOpenAvailable ? ['OPEN'] : []),
    ...(isCloseAvailable ? ['CLOSE'] : [])
  ];

  const [selectedGameType, setSelectedGameType] = useState(gameOptions[0] || 'OPEN');
  const [showDropdown, setShowDropdown] = useState(false);
  const [panaInput, setPanaInput] = useState('');
  const [points, setPoints] = useState('');
  const [bids, setBids] = useState([]);
  const [totalBids, setTotalBids] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [specialModeInputs, setSpecialModeInputs] = useState({});
  const [panaSuggestions, setPanaSuggestions] = useState([]);
  const [balance, setBalance] = useState(0.0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
    onClose: null
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
    try {
      const response = await getMarkets();
      if (response && response.status === true) {
        const currentMarket = response.data.find(m => m.market_name === gameName);
        if (currentMarket) {
          setMarketId(currentMarket.id);
          console.log('DoublePana Game: Market ID found:', currentMarket.id);
        } else {
          console.warn('DoublePana Game: Market not found for gameName:', gameName);
        }
      }
    } catch (error) {
      console.error('DoublePana Game: Error fetching markets:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBalance();
      fetchMarketId();
    }, [])
  );

  // Get all double pana numbers as flat array
  const getAllDoublePanas = () => {
    let allPanas = [];
    Object.values(DOUBLE_PANA_NUMBERS).forEach(panas => {
      allPanas = [...allPanas, ...panas];
    });
    return allPanas;
  };

  // Filter pana suggestions based on input
  const handlePanaInputChange = (value) => {
    setPanaInput(value);
    if (value.length > 0) {
      const allPanas = getAllDoublePanas();
      const filtered = allPanas.filter(pana => pana.startsWith(value));
      setPanaSuggestions(filtered);
    } else {
      setPanaSuggestions([]);
    }
  };

  // Select pana from suggestions
  const selectPanaSuggestion = (pana) => {
    setPanaInput(pana);
    setPanaSuggestions([]);
  };

  // Get current date in DD-MM-YYYY format
  const getCurrentDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Calculate totals when bids change
  useEffect(() => {
    let bidCount = bids.length;
    let pointSum = bids.reduce((sum, bid) => sum + parseInt(bid.points || 0), 0);
    setTotalBids(bidCount);
    setTotalPoints(pointSum);
  }, [bids]);

  // Check if a number is a palindrome
  const isPalindrome = (num) => {
    const str = num.toString();
    return str === str.split('').reverse().join('');
  };

  // Handle Add Bid in Easy Mode
  const handleAddBid = () => {
    if (!panaInput || panaInput.length !== 3) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please enter a valid 3-digit pana',
        type: 'error'
      });
      return;
    }
    // Check for palindrome numbers
    if (isPalindrome(panaInput)) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Palindrome numbers are not allowed',
        type: 'error'
      });
      return;
    }
    if (!points || parseInt(points) <= 0) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please enter valid points',
        type: 'error'
      });
      return;
    }

    const newBid = {
      id: `${panaInput}-${Date.now()}-${Math.random()}`,
      pana: panaInput,
      points: points,
      type: selectedGameType.toLowerCase(),
    };

    setBids(prev => [...prev, newBid]);
    setPanaInput('');
    setPoints('');
  };

  // Handle input change in Special Mode
  const handleSpecialModeInput = (pana, value) => {
    setSpecialModeInputs(prev => ({
      ...prev,
      [pana]: value,
    }));
  };

  // Handle Submit in Special Mode
  const handleSpecialModeSubmit = () => {
    const newBids = [];
    Object.keys(specialModeInputs).forEach(pana => {
      const pointValue = specialModeInputs[pana];
      if (pointValue && parseInt(pointValue) > 0) {
        newBids.push({
          id: `${pana}-${Date.now()}-${Math.random()}`,
          pana: pana,
          points: pointValue,
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

    setBids(newBids);
    setShowConfirmModal(true);
  };

  const handleDeleteBid = (bidId) => {
    setBids(prev => prev.filter(bid => bid.id !== bidId));
  };

  const handleSubmit = () => {
    if (bids.length === 0) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please add at least one bid',
        type: 'error'
      });
      return;
    }
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
        const amounts = typeBids.map(b => parseInt(b.points));

        // API expects session based on type
        // The type in bids is lower case 'open' or 'close' from selectedGameType.toLowerCase()
        // We should ensure it matches what API expects: likely 'OPEN'/'CLOSE' or whatever SinglePatti used.
        // SinglePatti used `type` directly which was from `bid.type`
        // In this file, `selectedGameType` is 'OPEN'/'CLOSE'
        // But `handleAddBid` forces `.toLowerCase()`: `type: selectedGameType.toLowerCase()` (line 190)
        // API usually expects 'OPEN' or 'CLOSE' in caps for session? 
        // Let's check SinglePanaGame logic.
        // SinglePanaGame: `bid.type` comes from `selectedGame` which is 'OPEN'/'CLOSE'.
        // Here: `handleAddBid` converts to lowercase.
        // I should send uppercase to API to be safe/consistent with previous games if they use 'OPEN'/'CLOSE'.
        // Let's convert `type` to uppercase for the API call.

        const session = type.toUpperCase();

        // console.log(`Submitting Double Patti Bids for ${session}:`, { userId, username, numbers, amounts, gameName, marketId, session });

        const response = await DoublePatti(userId, username, numbers, amounts, gameName, String(marketId), session);

        const isSuccess = response && (
          response.status === 'success' ||
          response.status === true ||
          response.status === 'true' ||
          (response.message && typeof response.message === 'string' && response.message.toLowerCase().includes('success'))
        );

        if (isSuccess) {
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
            setBids([]);
            setPoints('');
            setPanaInput('');
            setSpecialModeInputs({});
            fetchBalance();
          }
        });
      }

    } catch (error) {
      console.error("Error submitting bids:", error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Network request failed',
        type: 'error'
      });
    }
  };

  const renderBidItem = ({ item }) => (
    <View style={styles.bidRow}>
      <Text style={styles.bidCell}>{item.pana}</Text>
      <Text style={styles.bidCell}>{item.points}</Text>
      <Text style={styles.bidCell}>{item.type}</Text>
      <TouchableOpacity onPress={() => handleDeleteBid(item.id)} style={styles.deleteBtn}>
        <View style={styles.deleteIconContainer}>
          <Ionicons name="trash-outline" size={12} color="#C36578" />
        </View>
      </TouchableOpacity>
    </View>
  );

  // Render Special Mode Number Grid
  const renderSpecialModeGrid = () => {
    return (
      <ScrollView style={styles.specialModeScroll} showsVerticalScrollIndicator={false}>
        {Object.keys(DOUBLE_PANA_NUMBERS).map(digit => (
          <View key={digit} style={styles.digitSection}>
            <View style={styles.digitHeader}>
              <Text style={styles.digitHeaderText}>{digit}</Text>
            </View>
            <View style={styles.panaGrid}>
              {DOUBLE_PANA_NUMBERS[digit].map(pana => (
                <View key={pana} style={styles.panaItem}>
                  <View style={styles.panaNumberBox}>
                    <Text style={styles.panaNumberText}>{pana}</Text>
                  </View>
                  <TextInput
                    style={styles.panaInput}
                    placeholder=""
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={specialModeInputs[pana] || ''}
                    onChangeText={(value) => handleSpecialModeInput(pana, value.replace(/[^0-9]/g, ''))}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      {/* Header with Marquee */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <MarqueeText text={`${gameName} - DOUBLE PANA`} style={styles.headerTitle} />
        <View style={styles.balanceChip}>
          <Ionicons name="wallet" size={16} color="#fff" />
          <Text style={styles.balanceText}>{balance.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.staticContent}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'easy' && styles.modeButtonActive]}
            onPress={() => setMode('easy')}
          >
            <Text style={[styles.modeButtonText, mode === 'easy' && styles.modeButtonTextActive]}>
              EASY MODE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'special' && styles.modeButtonActive]}
            onPress={() => setMode('special')}
          >
            <Text style={[styles.modeButtonText, mode === 'special' && styles.modeButtonTextActive]}>
              SPECIAL MODE
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'easy' ? (
          <>
            {/* Easy Mode Content */}
            {/* Game Type Dropdown */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Select Game Type:</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <Text style={styles.dropdownText}>{selectedGameType}</Text>
                  <Ionicons name="chevron-down" size={20} color="#B8860B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Pana Input */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Enter Double Pana:</Text>
              <View style={styles.panaInputContainer}>
                <TextInput
                  style={styles.panaTextInput}
                  placeholder="Pana"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={3}
                  value={panaInput}
                  onChangeText={(value) => handlePanaInputChange(value.replace(/[^0-9]/g, ''))}
                />
                {panaSuggestions.length > 0 && (
                  <View style={styles.suggestionsDropdown}>
                    <ScrollView
                      style={styles.suggestionsScroll}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {panaSuggestions.map((pana, index) => (
                        <TouchableOpacity
                          key={`${pana}-${index}`}
                          style={styles.suggestionItem}
                          onPress={() => selectPanaSuggestion(pana)}
                        >
                          <Text style={styles.suggestionText}>{pana}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Points Input */}
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Enter Points:</Text>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Point"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={points}
                  onChangeText={(text) => setPoints(text.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>

            {/* Add Button */}
            <TouchableOpacity style={styles.addButton} onPress={handleAddBid}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { color: '#C36578' }]}>Pana</Text>
              <Text style={[styles.tableHeaderText, { color: '#C36578' }]}>Point</Text>
              <Text style={[styles.tableHeaderText, { color: '#C36578' }]}>Type</Text>
              <Text style={[styles.tableHeaderText, { color: '#C36578' }]}>Delete</Text>
            </View>
          </>
        ) : (
          <View style={styles.specialModeHeaderFixed}>
            <View style={styles.specialModeHeader}>
              <View style={styles.datePickerBtn}>
                <Ionicons name="calendar-outline" size={16} color="#C36578" />
                <Text style={styles.dateText}>{getCurrentDate()}</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownSmall}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text style={styles.dropdownText}>{selectedGameType}</Text>
                <Ionicons name="chevron-down" size={18} color="#B8860B" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollableContent} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {mode === 'easy' ? (
          <>
            {/* Bids List */}
            {bids.length === 0 ? (
                <View style={styles.emptyList}>
                  <Text style={styles.emptyText}>No bids added yet</Text>
                </View>
            ) : (
                bids.map((item) => (
                  <View key={item.id} style={styles.bidRow}>
                    <Text style={styles.bidCell}>{item.pana}</Text>
                    <Text style={styles.bidCell}>{item.points}</Text>
                    <Text style={styles.bidCell}>{item.type}</Text>
                    <TouchableOpacity onPress={() => handleDeleteBid(item.id)} style={styles.deleteBtn}>
                      <View style={styles.deleteIconContainer}>
                        <Ionicons name="trash-outline" size={12} color="#C36578" />
                      </View>
                    </TouchableOpacity>
                  </View>
                ))
            )}
          </>
        ) : (
          <>
            {/* Special Mode Content */}
            {renderSpecialModeGrid()}
          </>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      {mode === 'easy' ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 15), height: 75 + insets.bottom }]}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Bids</Text>
              <Text style={styles.statValue}>{totalBids}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Points</Text>
              <Text style={styles.statValue}>{totalPoints}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.fullSubmitButton, { paddingBottom: Math.max(insets.bottom, 18), height: 60 + insets.bottom }]}
          onPress={handleSpecialModeSubmit}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      )}

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
                  <Text style={[styles.confirmBidText, { flex: 1 }]}>{bid.points}</Text>
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
                onPress={() => {
                  if (mode === 'special') setBids([]);
                  setShowConfirmModal(false);
                }}
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
    backgroundColor: '#F5EDE0',
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 150,
  },
  specialModeHeaderFixed: {
    marginBottom: 0,
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modeButtonActive: {
    backgroundColor: '#C36578',
    borderColor: '#C36578',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  dropdown: {
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
  dropdownContainer: {
    flex: 1.2,
  },
  dropdownSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
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
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    marginLeft: '40%',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  textInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    textAlign: 'center',
  },
  textInputContainer: {
    flex: 1.2,
  },
  panaInputContainer: {
    flex: 1.2,
    position: 'relative',
    zIndex: 1000,
    width: '100%',
  },
  // CHANGED: Styled to match 'textInput' and 'dropdown' exactly
  panaTextInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    textAlign: 'center',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 50, // Adjusted position to fit new smaller input size
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    maxHeight: 250,
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  suggestionsScroll: {
    maxHeight: 250,
  },
  suggestionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#C36578',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  bidsList: {
    flex: 1,
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  bidCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
  },
  deleteBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C36578',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyList: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins_600SemiBold',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F5EDE0',
    borderTopWidth: 2,
    borderTopColor: '#C36578',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
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
    paddingHorizontal: 45,
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  fullSubmitButton: {
    backgroundColor: '#C36578',
    paddingVertical: 18,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center'
  },
  // Special Mode Styles
  specialModeHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
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
  specialModeScroll: {
    flex: 1,
  },
  digitSection: {
    marginBottom: 85,
  },
  digitHeader: {
    backgroundColor: '#2E4A3E',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  digitHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  panaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  panaItem: {
    flexDirection: 'row',
    width: '48%',
    marginBottom: 8,
  },
  panaNumberBox: {
    backgroundColor: '#C36578',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  panaNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  panaInput: {
    flex: 1,
    backgroundColor: '#E8E4DD',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
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
