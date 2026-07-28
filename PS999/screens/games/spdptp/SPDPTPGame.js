import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, spdptp, getMarkets } from '../../../api/auth';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../../components/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;

const MarqueeText = ({ text, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const containerWidth = SCREEN_WIDTH - 140;
  useEffect(() => {
    if (textWidth > 0) {
      animatedValue.setValue(containerWidth);
      Animated.loop(Animated.timing(animatedValue, { toValue: -textWidth, duration: 8000, easing: Easing.linear, useNativeDriver: true })).start();
    }
  }, [textWidth, containerWidth]);
  return (
    <View style={{ width: containerWidth, overflow: 'hidden', alignItems: 'center' }}>
      <Animated.Text onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)} style={[style, { transform: [{ translateX: animatedValue }] }]} numberOfLines={1}>
        {text}   {text}   {text}
      </Animated.Text>
    </View>
  );
};


export default function SPDPTPGame({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { gameName, marketId, gameSession, marketName } = route.params;
  const [balance, setBalance] = useState(0.0);
  const [loading, setLoading] = useState(false);
  const [currentMarketId, setCurrentMarketId] = useState(marketId);

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

  const fetchMarkets = async () => {
    try {
      const response = await getMarkets();
      if (response && response.status === true) {
        const currentMarket = response.data.find(m => m.market_name === gameName);
        if (currentMarket) {
          setCurrentMarketId(currentMarket.id);
          console.log('Market fetched and updated:', currentMarket.id);
        }
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBalance();
      fetchMarkets();
    }, [])
  );


  const [selectedGame, setSelectedGame] = useState(gameSession || 'CLOSE');
  // Use current date or passed date
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB').replace(/\//g, '-'));
  const [sp, setSp] = useState(false);
  const [dp, setDp] = useState(false);
  const [tp, setTp] = useState(false);
  const [digit, setDigit] = useState('');
  const [points, setPoints] = useState('');
  const [bids, setBids] = useState([]);
  const [totalBids, setTotalBids] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPointsError, setShowPointsError] = useState(false);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
    onClose: null
  });

  const generatePanas = () => {
    if (!digit || !points) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please enter digit and points',
        type: 'error'
      });
      return;
    }

    const pointsNum = parseInt(points);
    if (pointsNum < 5) {
      setShowPointsError(true);
      return;
    }
    setShowPointsError(false);

    if (!sp && !dp && !tp) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please select at least one option (SP, DP, or TP)',
        type: 'error'
      });
      return;
    }

    const newBids = [];
    const digitNum = parseInt(digit);

    // Helper function to get sum of digits
    const getDigitSum = (num) => {
      const str = num.toString().padStart(3, '0');
      return parseInt(str[0]) + parseInt(str[1]) + parseInt(str[2]);
    };

    // Helper function to count unique digits
    const countUniqueDigits = (num) => {
      const str = num.toString().padStart(3, '0');
      const digits = [parseInt(str[0]), parseInt(str[1]), parseInt(str[2])];
      return new Set(digits).size;
    };

    // Generate TP (Triple Pana - all 3 digits same, e.g., 000, 111, 222, ..., 999)
    // Only 1 result for the given digit
    if (tp) {
      const tpNum = digitNum * 111; // e.g., if digit is 5, then 555
      if (tpNum >= 0 && tpNum <= 999) {
        newBids.push({
          id: `tp-${tpNum}`,
          pana: tpNum.toString().padStart(3, '0'),
          point: pointsNum,
          type: 'TP',
          session: selectedGame,
        });
      }
    }

    // Generate DP (Double Pana - exactly 2 digits same)
    // 9 results for each digit
    if (dp) {
      const dpPanas = [];
      for (let i = 0; i <= 9; i++) {
        if (i !== digitNum) {
          // Two positions with digitNum, one with i
          dpPanas.push(parseInt(`${digitNum}${digitNum}${i}`));
          dpPanas.push(parseInt(`${digitNum}${i}${digitNum}`));
          dpPanas.push(parseInt(`${i}${digitNum}${digitNum}`));
        }
      }

      // Remove duplicates and take first 9
      const uniqueDpPanas = [...new Set(dpPanas)].slice(0, 9);
      uniqueDpPanas.forEach((pana, index) => {
        newBids.push({
          id: `dp-${pana}-${index}`,
          pana: pana.toString().padStart(3, '0'),
          point: pointsNum,
          type: 'DP',
          originalDigit: digit,
          session: selectedGame,
        });
      });
    }

    // Generate SP (Single Pana - all 3 digits different)
    // 12 results for each digit
    if (sp) {


      // Re-implementing logic cleanly to avoid potential copy-paste errors from replacement
      const spPanasCorrect = [];
      for (let i = 0; i <= 9; i++) {
        if (i !== digitNum) {
          for (let j = 0; j <= 9; j++) {
            if (j !== digitNum && j !== i) {
              spPanasCorrect.push(parseInt(`${digitNum}${i}${j}`));
              spPanasCorrect.push(parseInt(`${digitNum}${j}${i}`));
              spPanasCorrect.push(parseInt(`${i}${digitNum}${j}`));
              spPanasCorrect.push(parseInt(`${i}${j}${digitNum}`));
              spPanasCorrect.push(parseInt(`${j}${digitNum}${i}`));
              spPanasCorrect.push(parseInt(`${j}${i}${digitNum}`));
            }
          }
        }
      }


      // Remove duplicates and take first 12
      const uniqueSpPanas = [...new Set(spPanasCorrect)].slice(0, 12);
      uniqueSpPanas.forEach((pana, index) => {
        newBids.push({
          id: `sp-${pana}-${index}`,
          pana: pana.toString().padStart(3, '0'),
          point: pointsNum,
          type: 'SP',
          originalDigit: digit,
          session: selectedGame,
        });
      });
    }

    // Add new bids to existing bids
    const updatedBids = [...bids, ...newBids];
    setBids(updatedBids);
    setTotalBids(updatedBids.length);
    const newTotalPoints = updatedBids.reduce((sum, bid) => sum + parseInt(bid.point), 0);
    setTotalPoints(newTotalPoints);
  };

  const deleteBid = (id) => {
    const bidToDelete = bids.find(b => b.id === id);
    const updatedBids = bids.filter(b => b.id !== id);
    setBids(updatedBids);
    setTotalBids(updatedBids.length);
    setTotalPoints(totalPoints - parseInt(bidToDelete.point));
  };

  const handleSubmit = () => {
    if (bids.length > 0) {
      setShowConfirmModal(true);
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'No bids to submit. Please generate bids first.',
        type: 'error'
      });
    }
  };

  const confirmSubmit = async () => {
    setLoading(true);
    setShowConfirmModal(false);

    try {
      const userId = await AsyncStorage.getItem('userId');
      const username = await AsyncStorage.getItem('userName') || await AsyncStorage.getItem('userMobile'); // Fallback to mobile if name not found

      if (!userId || !currentMarketId) {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: 'User ID or Market ID not found. Please login again or restart the app.',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      // Calculate total amount
      const currentTotalAmount = bids.reduce((sum, bid) => sum + parseInt(bid.point), 0);

      // Format bids to match expected API structure
      const formattedBids = bids.map(bid => ({
        digit: bid.pana,
        points: parseInt(bid.point),
        type: bid.type,
        session: bid.session || selectedGame
      }));

      const response = await spdptp(
        userId,
        username,
        formattedBids,
        marketName || gameName,
        currentMarketId,
        currentTotalAmount
      );

      // Check for success status or success message in the response
      const isSuccess = response && (
        response.status === true ||
        response.status === 'true' ||
        response.status === 'success' ||
        (response.message && typeof response.message === 'string' && response.message.toLowerCase().includes('success'))
      );

      if (isSuccess) {
        setAlertConfig({
          visible: true,
          title: 'Success',
          message: 'Bids submitted successfully!',
          type: 'success'
        });
        setBids([]);
        setTotalBids(0);
        setTotalPoints(0);
        setDigit('');
        setPoints('');
        fetchBalance(); // Refresh balance
      } else {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: response?.message || 'Failed to submit bids. Please check your balance and try again.',
          type: 'error'
        });
        fetchBalance();
      }

    } catch (error) {
      console.error('Error submitting bids:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'An error occurred while submitting bids. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <MarqueeText text={`${gameName} - SP DP TP`} style={styles.headerTitle} />
        <View style={styles.balanceChip}>
          <Ionicons name="wallet" size={16} color="#fff" />
          <Text style={styles.balanceText}>{balance.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.staticContent}>
        <View style={styles.dateRow}>
          <View style={styles.dateBox}>
            <Ionicons name="calendar" size={20} color="#C36578" />
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownText}>{selectedGame}</Text>
            <Ionicons name="chevron-down" size={20} color="#F5C542" />
          </View>
        </View>

        {/* Checkboxes */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkboxItem}
            onPress={() => {
              setSp(!sp);
              setDp(false);
              setTp(false);
            }}
          >
            <View style={[styles.checkbox, sp && styles.checkboxChecked]}>
              {sp && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>SP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxItem}
            onPress={() => {
              setDp(!dp);
              setSp(false);
              setTp(false);
            }}
          >
            <View style={[styles.checkbox, dp && styles.checkboxChecked]}>
              {dp && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>DP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxItem}
            onPress={() => {
              setTp(!tp);
              setSp(false);
              setDp(false);
            }}
          >
            <View style={[styles.checkbox, tp && styles.checkboxChecked]}>
              {tp && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>TP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Enter Digit:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputField}
              placeholder="Number"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={1}
              value={digit}
              onChangeText={(text) => setDigit(text.replace(/[^0-9]/g, ''))}
            />
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Enter Points:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputField}
              placeholder="Point"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={points}
              onChangeText={(text) => {
                setPoints(text.replace(/[^0-9]/g, ''));
                if (showPointsError) setShowPointsError(false);
              }}
            />
            {showPointsError && (
              <>
                <View style={styles.warningIconContainer}>
                  <Ionicons name="information-circle" size={20} color="#ff0000" />
                </View>
                <View style={styles.tooltipContainer}>
                  <View style={styles.tooltipArrow} />
                  <View style={styles.tooltipBubble}>
                    <Text style={styles.tooltipText}>min amount 5</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={generatePanas}>
          <Text style={styles.generateButtonText}>Genrate</Text>
        </TouchableOpacity>

        {bids.length > 0 && (
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Pana</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Point</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Type</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Delete</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollableContent} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {bids.length > 0 ? (
          bids.map((bid) => (
            <View key={bid.id} style={styles.bidRow}>
              <Text style={[styles.bidText, { flex: 1 }]}>{bid.pana}</Text>
              <Text style={[styles.bidText, { flex: 1 }]}>{bid.point}</Text>
              <Text style={[styles.bidText, { flex: 1 }]}>{bid.type}</Text>
              <TouchableOpacity
                style={{ flex: 1, alignItems: 'center' }}
                onPress={() => deleteBid(bid.id)}
              >
                <Ionicons name="trash" size={20} color="#C36578" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bids generated yet</Text>
          </View>
        )}
      </ScrollView>

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
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Your Bids</Text>

            <View style={styles.modalTableHeader}>
              <Text style={styles.modalHeaderText}>Jodi</Text>
              <Text style={styles.modalHeaderText}>Points</Text>
              <Text style={styles.modalHeaderText}>Type</Text>
            </View>

            <ScrollView style={styles.modalBidsList}>
              {bids.map((bid) => (
                <View key={bid.id} style={styles.modalBidRow}>
                  <Text style={styles.modalBidText}>{bid.pana}</Text>
                  <Text style={styles.modalBidText}>{bid.point}</Text>
                  <Text style={styles.modalBidText}>{bid.type}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalTotalContainer}>
              <Text style={styles.modalTotalText}>Total Bids: {totalBids}</Text>
              <Text style={styles.modalTotalText}>Total Points: {totalPoints}</Text>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmSubmit}
              >
                <Text style={styles.modalConfirmButtonText}>Confirm Submit</Text>
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
  container: { flex: 1, backgroundColor: '#F5EDE0' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: 40,
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
  backButton: {
    padding: 5,
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Poppins_400Regular',
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  dateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
  },
  dateText: { fontSize: 14, color: '#000', fontFamily: 'Poppins_600SemiBold' },
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
  dropdownText: { fontSize: 14, color: '#000', fontFamily: 'Poppins_600SemiBold' },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
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
  inputContainer: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
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
  warningIconContainer: {
    position: 'absolute',
    right: 10,
    zIndex: 20,
  },
  tooltipContainer: {
    position: 'absolute',
    top: 45,
    right: -10,
    alignItems: 'center',
    zIndex: 30,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
    backgroundColor: 'transparent',
    marginTop: -5,
    zIndex: 31,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  tooltipBubble: {
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tooltipText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Poppins_600SemiBold',
  },
  generateButton: {
    backgroundColor: '#C36578',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButtonText: {
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
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bidText: {
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  totalBidsText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C36578',
    marginTop: 10,
    marginBottom: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#F5EDE0',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderTopWidth: 2,
    borderTopColor: '#C36578',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#C36578',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalHeaderText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  modalBidsList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  modalBidRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalBidText: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  modalTotalContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 15,
  },
  modalTotalText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 3,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#808080',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#C36578',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
});
