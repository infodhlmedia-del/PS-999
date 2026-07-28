import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, SinglePatti, getMarkets } from '../../../api/auth';
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
import CustomAlert from '../../../components/CustomAlert';
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

export default function SinglePanaGame({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { gameName, isOpenAvailable = true, isCloseAvailable = true } = route.params;
  const [mode, setMode] = useState('easy');
  const [marketId, setMarketId] = useState(null);

  // Filter game options based on availability
  const gameOptions = [
    ...(isOpenAvailable ? ['OPEN'] : []),
    ...(isCloseAvailable ? ['CLOSE'] : [])
  ];

  const [selectedGame, setSelectedGame] = useState(gameOptions[0] || 'OPEN');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pana, setPana] = useState('');
  const [points, setPoints] = useState('');
  const [bids, setBids] = useState([]);
  const [totalBids, setTotalBids] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [balance, setBalance] = useState(0.0);

  // Special Mode State
  const [specialModePoints, setSpecialModePoints] = useState({}); // { pana: points }
  const [currentDate, setCurrentDate] = useState(new Date());

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
    onClose: null
  });

  // Generate Single Panas grouped by Digit
  const singlePanas = useMemo(() => {
    const groups = {};
    for (let i = 0; i <= 9; i++) {
      groups[i] = [];
    }

    // Standard Single Pana Logic (Combined unique 3 digits)
    // There are 220 Single Panas.
    // Iterating to find valid single panas
    for (let i = 0; i < 10; i++) {
      for (let j = i + 1; j < 10; j++) {
        for (let k = j + 1; k < 10; k++) {
          if (i !== j && j !== k && i !== k) { // Unique digits
            // Check uniqueness is already guaranteed by loops (i < j < k? No.)
            // Actually 123 is single pana. 112 is double.
            // We need to form the number and find sum.
            const sum = (i + j + k) % 10;
            // Format as string "123"
            // Digits must be sorted? Usually Pana is displayed sorted e.g. 123, not 321.
            // My loop ensures i < j < k, which is naturally sorted if we loop 0-9 correctly?
            // Wait, 0 is tricky. 0 usually handled as 10? No, in Pana digits are 0-9.
            // Digit order 1,2,3...9,0?
            // Usually standard format: increasing order. 
            // e.g. 127 sum=0. 
            // 389 sum=0 (3+8+9=20).
            // 578 sum=0 (5+7+8=20).
            // 460? 4+6+0=10 (0). But should it be sorted? 
            // Standard sorting puts 0 at the end if we consider value? 
            // Actually standard Pana representation usually sorts digits ascending.
            // 460 -> 046? No. 460 is presented as 460.
            // Let's stick to standard sorted digits: i < j < k.
            // But handle 0 special?
            // In Matka: 120 is displayed as 120? Or 012? Usually 120.
            // Let's assume ascending order of digits i,j,k where 0 is just 0.
            // 127 -> 1,2,7. 
            // 460 -> 4,6,0. (Sum 10 -> 0).
            // 569 -> 5,6,9.
            // 589 -> 22 -> 2.
            // Special requirement: digits are usually distinct.

            // Wait, my loop i<j<k produces sorted i,j,k.
            // If i=0, j=1, k=2 -> 012?
            // Let's check generally accepted single pana matching 120.
            // 120 -> 3. (1+2+0=3).
            // Is 120 valid? Yes.
            // Is 136 valid? yes sum 10->0.

            // BUT, Matka sorting:
            // Usually 0 is treated as 10 for sorting? 
            // Or just raw numerical sort?
            // Let's use simple string sort for display if needed.
            // The screenshot shows: 127, 136, 145...
            // 460 is there.
            // 578 is there.
            // 370 is there.
            // It seems sorting is partial.
            // Let's just generate strict ascending i<j<k

            // However, 0 handling. 
            // 460 (sorted 0,4,6?) -> 046?
            // If I generate 0,4,6 -> Sum=10 -> 0.
            // Is it displayed as 046 or 460?
            // Screenshot shows 460.
            // Screenshot shows 370.
            // Screenshot shows 190.
            // It seems if there is a 0, it wraps to the end?
            // "127": 1,2,7. 
            // "569": 5,6,9.
            // "460": 4,6,0? (0 is last).
            // So generic rule: Sorted inputs, but if 0 is present, move it to end?
            // Exception: what if multiple? Single pana distinct digits.
            // Let's verify with 370 -> 3,7,0. (Sorted 0,3,7 -> 370).
            // 190 -> 1,9,0.
            // So logic: Sort digits. If 0 is present, it goes to the end.
            // Example: 0,1,2 -> 120.
            // 0,4,6 -> 460.
            // 0,1,9 -> 190.
            // 0,5,5 -> Double.

            let d1 = i, d2 = j, d3 = k;
            let digits = [d1, d2, d3];
            // Move 0 to end if present
            const zeroIndex = digits.indexOf(0);
            if (zeroIndex !== -1) {
              digits.splice(zeroIndex, 1);
              digits.push(0);
            }
            const panaStr = digits.join('');
            groups[sum].push(panaStr);
          }
        }
      }
    }

    // Sort panas within groups primarily numerically?
    // Screenshot has 127, 136, 145, 190...
    // 127 < 136 < 145 < 190.
    // 235, 280.
    // 370.
    // 479.
    // 289 ? No 389 is next in list.
    // 460 ?
    // 460 is after 479?
    // 569.
    // 389? Wait. 389 is listed after 569? That's weird.
    // And 578.
    // Screenshot order:
    // 127, 136, 145, 190, 235, 280, 370, 479, 460, 569, 389, 578.
    // It's mostly sorted but 389 is late?
    // 460 is after 479?
    // 479 -> 20.
    // 460 -> 10.
    // 569 -> 20.
    // 389 -> 20.
    // 578 -> 20.
    // The screenshot ordering is a bit specific. I will just stick to numerical sort for now,
    // Users usually just want to find it.

    for (let g in groups) {
      groups[g].sort();
    }
    return groups;
  }, []);

  const handleSpecialPointChange = (pana, value) => {
    setSpecialModePoints(prev => {
      if (!value) {
        const upd = { ...prev };
        delete upd[pana];
        return upd;
      }
      return {
        ...prev,
        [pana]: value
      }
    });
  };

  const calculateSpecialTotal = () => {
    let total = 0;
    let count = 0;
    Object.values(specialModePoints).forEach(v => {
      const p = parseInt(v);
      if (!isNaN(p)) {
        total += p;
        count++;
      }
    });
    return { total, count };
  };

  const { total: specialTotalPoints, count: specialTotalBids } = calculateSpecialTotal();

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
          console.log('SinglePana Game: Market ID found:', currentMarket.id);
        } else {
          console.warn('SinglePana Game: Market not found for gameName:', gameName);
        }
      }
    } catch (error) {
      console.error('SinglePana Game: Error fetching markets:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBalance();
      fetchMarketId();
    }, [])
  );

  const addBid = () => {
    if (pana && points) {
      const newBid = {
        id: Date.now(),
        pana: pana,
        point: points,
        type: selectedGame,
      };
      setBids([...bids, newBid]);
      setTotalBids(totalBids + 1);
      setTotalPoints(totalPoints + parseInt(points));
      setPana('');
      setPoints('');
    }
  };

  const deleteBid = (id) => {
    const bidToDelete = bids.find(b => b.id === id);
    setBids(bids.filter(b => b.id !== id));
    setTotalBids(totalBids - 1);
    setTotalPoints(totalPoints - parseInt(bidToDelete.point));
  };

  const handleSubmit = async () => {
    let finalBids = [...bids];

    if (mode === 'special') {
      // Convert special mode points to bids
      const specialBidsToAdd = [];
      Object.keys(specialModePoints).forEach(p => {
        const pts = specialModePoints[p];
        if (pts && !isNaN(pts) && parseInt(pts) > 0) {
          specialBidsToAdd.push({
            id: Date.now() + Math.random(),
            pana: p,
            point: pts,
            type: selectedGame
          });
        }
      });

      if (specialBidsToAdd.length > 0) {
        finalBids = [...finalBids, ...specialBidsToAdd];
        setBids(finalBids);
        setTotalBids(finalBids.length);
        const newTotalPoints = finalBids.reduce((sum, b) => sum + (parseInt(b.point) || 0), 0);
        setTotalPoints(newTotalPoints);

        // Clear special inputs after adding to list (optional, but good for UX)
        // setSpecialModePoints({}); 
      }
    }

    if (finalBids.length === 0) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please add some bids first.',
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
        const amounts = typeBids.map(b => parseInt(b.point));

        // API expects 'session' parameter which is 'OPEN' or 'CLOSE'
        // derived from bid.type
        // console.log(`Submitting Single Patti Bids for ${type}:`, { userId, username, numbers, amounts, gameName, marketId, type });

        const response = await SinglePatti(userId, username, numbers, amounts, gameName, String(marketId), type);

        if (response && response.status === 'success') {
          successCount++;
        } else {
          setAlertConfig({
            visible: true,
            title: 'Error',
            message: `Failed to place ${type} bets: ${response?.message || 'Unknown error'}`,
            type: 'error'
          });
        }
      }

      if (successCount === totalTypes) {
        setAlertConfig({
          visible: true,
          title: 'Success',
          message: 'Bids Submitted Successfully!',
          type: 'success'
        });
        setBids([]);
        setTotalBids(0);
        setTotalPoints(0);
        setSpecialModePoints({});
        fetchBalance();
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <MarqueeText text={`${gameName} - SINGLE PANA`} style={styles.headerTitle} />
        <View style={styles.balanceChip}>
          <Ionicons name="wallet" size={16} color="#fff" />
          <Text style={styles.balanceText}>{balance.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.staticContent}>
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

        {mode === 'easy' ? (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Select Game Type:</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(true)}>
                <Text style={styles.dropdownText}>{selectedGame}</Text>
                <Ionicons name="chevron-down" size={20} color="#F5C542" />
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Enter Single Pana:</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Pana"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={3}
                value={pana}
                onChangeText={(text) => setPana(text.replace(/[^0-9]/g, ''))}
              />
            </View>

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

            <TouchableOpacity style={styles.addButton} onPress={addBid}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>

            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Pana</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Point</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Type</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Delete</Text>
            </View>
          </>
        ) : (
          <View style={styles.specialTopRowFixed}>
            <View style={styles.specialTopRow}>
              <View style={[styles.dateBox, { flex: 1, marginRight: 10 }]}>
                <Ionicons name="calendar" size={20} color="#C36578" style={{ marginRight: 8 }} />
                <Text style={styles.dateText}>
                  {currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                </Text>
              </View>
              <TouchableOpacity style={[styles.dropdown, { flex: 1 }]} onPress={() => setShowDropdown(true)}>
                <Text style={styles.dropdownText}>{selectedGame}</Text>
                <Ionicons name="chevron-down" size={20} color="#F5C542" />
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
          bids.map((bid) => (
            <View key={bid.id} style={styles.bidRow}>
              <Text style={[styles.bidText, { flex: 1 }]}>{bid.pana}</Text>
              <Text style={[styles.bidText, { flex: 1 }]}>{bid.point}</Text>
              <Text style={[styles.bidText, { flex: 1 }]}>{bid.type}</Text>
              <TouchableOpacity
                style={{ flex: 1, alignItems: 'center' }}
                onPress={() => deleteBid(bid.id)}
              >
                <Ionicons name="trash" size={20} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.specialModeContainer}>
            {/* Digit Groups */}
            {Object.keys(singlePanas).map((digit) => (
              <View key={digit} style={styles.digitGroup}>
                <View style={styles.digitHeaderContainer}>
                  <Text style={styles.digitHeader}>{digit}</Text>
                </View>
                <View style={styles.panaGrid}>
                  {singlePanas[digit].map((pVal) => (
                    <View key={pVal} style={styles.panaBox}>
                      <View style={styles.panaTitleBox}>
                        <Text style={styles.panaTitle}>{pVal}</Text>
                      </View>
                      <TextInput
                        style={styles.panaInput}
                        keyboardType="numeric"
                        value={specialModePoints[pVal] || ''}
                        onChangeText={(val) => handleSpecialPointChange(pVal, val.replace(/[^0-9]/g, ''))}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
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

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12), height: 75 + insets.bottom }]}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Bids</Text>
            <Text style={styles.statValue}>{mode === 'easy' ? totalBids : specialTotalBids}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Points</Text>
            <Text style={styles.statValue}>{mode === 'easy' ? totalPoints : specialTotalPoints}</Text>
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
        onClose={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.onClose) alertConfig.onClose();
        }}
      />
    </View >
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
    padding: 15,
    paddingBottom: 0,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 150,
  },
  specialTopRowFixed: {
    marginBottom: 0,
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
  modeTextActive: { color: '#fff' },
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
  dropdownText: { fontSize: 14, color: '#000', fontFamily: 'Poppins_600SemiBold' },
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
    backgroundColor: '#F5EDE0',
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
  modalOptionTextSelected: {
    color: '#2E4A3E',
  },
  // Special Mode Styles
  specialModeContainer: {
    marginTop: 0,
  },
  specialTopRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  digitGroup: {
    marginBottom: 20,
  },
  digitHeaderContainer: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  digitHeader: {
    backgroundColor: '#0A251B',
    color: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 40,
    borderRadius: 20,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
    overflow: 'hidden',
  },
  panaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  panaBox: {
    width: '48%', // 2 columns
    flexDirection: 'row',
    backgroundColor: '#D6DCDF',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    height: 50,
  },
  panaTitleBox: {
    backgroundColor: '#C36578',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  panaTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  panaInput: {
    flex: 1,
    backgroundColor: '#D6DCDF', // Light grey background matching screenshot
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
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
    marginTop: 10,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
