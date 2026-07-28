import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Animated,
  AppState,
  RefreshControl,
} from 'react-native';
import CustomLoader from '../../components/CustomLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { getWalletBalance, UserQrAddPointsRequests, paymentGetWay, paymentStatus, AdminContactDetailes } from '../../api/auth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';


export default function AddFundScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');

  const [balance, setBalance] = useState(0.0);
  const [userData, setUserData] = useState({ username: 'User', mobile: '', user_id: '' });
  const [adminContacts, setAdminContacts] = useState({
    call: '9999999999',
    whatsapp: '9999999999'
  });
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Animation for QR Button Blink
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [lastOrderId, setLastOrderId] = useState(null);
  const [lastSentAmount, setLastSentAmount] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyTab, setHistoryTab] = useState('accepted'); // 'accepted', 'approve', or 'processing'
  const appState = useRef(AppState.currentState);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
    onPress: null,
  });

  useEffect(() => {
    const startBlink = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(blinkAnim, {
              toValue: 0.4,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(blinkAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 0.9,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1.1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ])
      ).start();
    };
    startBlink();
  }, []);

  // Check status on app resume and load stored order data
  useEffect(() => {
    const initVerification = async () => {
      try {
        const storedOrderId = await AsyncStorage.getItem('lastOrderId');
        const storedAmount = await AsyncStorage.getItem('lastSentAmount');
        if (storedOrderId) {
          setLastOrderId(storedOrderId);
          if (storedAmount) setLastSentAmount(storedAmount);
        }
      } catch (e) {
        console.error('Error loading pending order:', e);
      }
    };

    initVerification();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App returned to foreground, refreshing data...');
        handleReturnFromPayment();
        // Always refresh user data and balance when returning to foreground
        fetchUserData();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleReturnFromPayment = async () => {
    try {
      const storedOrderId = await AsyncStorage.getItem('lastOrderId');
      console.log('Checking for stored order ID on return:', storedOrderId);
      if (storedOrderId) {
        setAlertConfig({
          visible: true,
          title: 'Payment Status',
          message: 'Did you complete the payment? Click OK to verify your transaction.',
          type: 'info',
          onPress: () => checkVerification()
        });
      }
    } catch (error) {
      console.error('Error in handleReturnFromPayment:', error);
    }
  };

  const checkVerification = async () => {
    try {
      const storedOrderId = await AsyncStorage.getItem('lastOrderId');
      const storedAmount = await AsyncStorage.getItem('lastSentAmount');

      if (!storedOrderId && !lastOrderId) {
        fetchUserData();
        return;
      }

      const idToVerify = storedOrderId || lastOrderId;
      const amtToVerify = storedAmount || lastSentAmount;

      const name = await AsyncStorage.getItem('userName') || userData.username || 'User';
      const mobile = await AsyncStorage.getItem('userMobile') || userData.mobile || '';

      await handleVerifyAndRefresh(idToVerify, amtToVerify, name, mobile);
    } catch (error) {
      console.error('Error in checkVerification:', error);
    }
  };

  const handleVerifyAndRefresh = async (orderId, amountToVerify, username, mobile) => {
    try {
      setLoadingHistory(true);

      console.log('Verifying payment for order:', orderId);
      const response = await paymentStatus(orderId);
      console.log('Payment Status API Response:', response);

      // Clear stored data after verification attempt
      await AsyncStorage.removeItem('lastOrderId');
      await AsyncStorage.removeItem('lastSentAmount');
      setLastOrderId(null);
      setLastSentAmount(null);

      // Check for success in the nested data object or root status
      const isSuccess = response && (
        (response.status === true && response.data?.status === 'success') ||
        response.status === 'SUCCESS' ||
        response.data?.status === 'COMPLETED'
      );

      if (isSuccess) {
        console.log('PAYMENT SUCCESS for TXN_ID:', orderId);
        setAlertConfig({
          visible: true,
          title: 'PAYMENT DONE',
          message: response.data?.message || `Your payment of ₹${amountToVerify} has been successfully verified.`,
          type: 'success',
          onPress: () => fetchUserData()
        });
      } else {
        console.log('-----------------------------------');
        console.log('PAYMENT STATUS: NOT DONE / PENDING');
        console.log('TXN_ID checked:', orderId);
        console.log('API Response Status:', response.data?.status || 'N/A');
        console.log('API Message:', response.data?.message || 'N/A');
        console.log('-----------------------------------');

        const isError = response.data?.status === 'error' || response.data?.status === 'FAILED';

        setAlertConfig({
          visible: true,
          title: isError ? 'PAYMENT NOT DONE' : 'PAYMENT PENDING',
          message: response.data?.message || 'Your payment status is currently pending or could not be verified. If amount was deducted, it will reflect within 24 hours.',
          type: isError ? 'error' : 'warning',
          onPress: () => fetchUserData()
        });
      }
    } catch (err) {
      console.error('Verify error:', err);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Something went wrong while verifying your payment. Please check your history in a few minutes.',
        type: 'error',
        onPress: () => fetchUserData()
      });
    } finally {
      setLoadingHistory(false);
    }
  };


  const handleManualVerify = async (orderId, amount) => {
    setLoadingHistory(true);
    try {
      const response = await paymentStatus(orderId);
      const isSuccess = response && (
        (response.status === true && response.data?.status === 'success') ||
        response.status === 'SUCCESS' ||
        response.data?.status === 'COMPLETED'
      );

      if (isSuccess) {
        setAlertConfig({
          visible: true,
          title: 'Verification Done',
          message: response.data?.message || `Payment of ₹${amount} verified successfully.`,
          type: 'success',
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Not Verified',
          message: response.data?.message || 'Payment is still pending or not found.',
          type: 'warning',
        });
      }
      await fetchUserData();
    } catch (error) {
      console.error('Manual Verify Error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to verify payment. Please try again later.',
        type: 'error'
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const mobile = await AsyncStorage.getItem('userMobile');
      const userId = await AsyncStorage.getItem('userId');
      setUserData({
        username: name || 'User',
        mobile: mobile || '',
        user_id: userId || '',
      });

      if (mobile && userId) {
        try {
          const contactsResponse = await AdminContactDetailes();
          if (contactsResponse && contactsResponse.status && contactsResponse.data) {
            setAdminContacts({
              call: contactsResponse.data.Call_Number || '9999999999',
              whatsapp: contactsResponse.data.Whatsapp || '9999999999'
            });
          }
        } catch (e) {
          console.error('Error fetching admin contacts:', e);
        }

        const response = await getWalletBalance(mobile, userId);
        if (response && (response.status === true || response.status === 'true')) {
          const newBalance = parseFloat(response.balance);
          if (newBalance > balance && balance !== 0) {
            setAlertConfig({
              visible: true,
              title: 'Success!',
              message: `₹ ${newBalance - balance} successfully added to your wallet.`,
              type: 'success'
            });
          }
          setBalance(newBalance);
        }
      }

      if (userId) {
        setLoadingHistory(true);
        const histResponse = await UserQrAddPointsRequests(userId);
        if (histResponse && (histResponse.status === true || histResponse.status === 'true')) {
          const mappedHistory = (histResponse.data || []).map(item => ({
            id: item.id,
            amount: item.request_amount,
            status: item.request_accecept_status === "1" ? "success" : "processing",
            created_at: `${item.request_date} ${item.request_time}`,
            order_id: item.utr_trs_id
          }));
          setHistory(mappedHistory);
        }
        setLoadingHistory(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoadingHistory(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, [fetchUserData]);

  const quickAmounts = [100, 200, 500, 1000, 1500, 2000];

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const handleCall = () => {
    Linking.openURL(`tel:+91${adminContacts.call}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(`https://wa.me/91${adminContacts.whatsapp}`);
  };

  const handleQRScan = () => {
    navigation.navigate('QRCodePaymentScreen');
  };

  const decodeBase64 = (str) => {
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let output = '';
      str = String(str).replace(/=+$/, '');
      if (str.length % 4 === 1) return null;
      for (
        let bc = 0, bs, buffer, idx = 0;
        (buffer = str.charAt(idx++));
        ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
          ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
          : 0
      ) {
        buffer = chars.indexOf(buffer);
      }
      return output;
    } catch (e) {
      return null;
    }
  };

  const handleAddFund = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Please enter a valid amount.',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      // console.log('Initiating payment for user:', userData.user_id, 'Amount:', amount);
      const response = await paymentGetWay(userData.user_id, userData.username, userData.mobile, amount);
      // console.log('Payment Gateway Response:', response);

      if (response) {
        const potentialFields = [
          response.payment_url,
          response.url,
          response.redirect_url,
          response.error,
          response.msg,
          response.upi,
          response.data?.url,
          response.data?.upi
        ];

        let targetUrl = null;
        for (const field of potentialFields) {
          if (!field || typeof field !== 'string') continue;

          if (field.startsWith('http') || field.startsWith('upi')) {
            targetUrl = field;
            break;
          }

          const decoded = decodeBase64(field);
          if (decoded && (decoded.startsWith('http') || decoded.startsWith('upi'))) {
            targetUrl = decoded;
            break;
          }
        }

        if (targetUrl) {
          const orderId = response.order_id || response.txnId || response.txn_id || response.id || null;

          if (orderId) {
            await AsyncStorage.setItem('lastOrderId', orderId.toString());
            await AsyncStorage.setItem('lastSentAmount', amount.toString());
            setLastOrderId(orderId);
            setLastSentAmount(amount);
          }

          console.log('Redirecting to target URL:', targetUrl);
          Linking.openURL(encodeURI(targetUrl)).catch(err => {
            console.error('Linking error:', err);
          });
          setAmount('');
        } else if (response.status === 200 || response.status === true || response.status === 'true' || response.status === 1 || response.status === 'success' || response.status === 'SUCCESS') {
          setAlertConfig({
            visible: true,
            title: 'Request Sent',
            message: response.msg || response.message || 'Payment request submitted successfully.',
            type: 'success',
            onPress: () => fetchUserData()
          });
          setAmount('');
        } else {
          setAlertConfig({
            visible: true,
            title: 'Payment Error',
            message: response.msg || response.message || 'Payment could not be processed. Please check your data.',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Payment Error:', error);
      setAlertConfig({
        visible: true,
        title: 'Network Error',
        message: 'Failed to connect to payment gateway.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Add  Fund</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>

          <TouchableOpacity onPress={() => navigation.navigate('AddFundHistory')} style={styles.historyBtn}>
            <Ionicons name="time" size={24} color="#C27183" />
          </TouchableOpacity>
          <View style={styles.coinsBadge}>

            <MaterialCommunityIcons name="cash-multiple" size={16} color="#fff" />
            <Text style={styles.coinsText}>{balance.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="transparent"
              colors={['transparent']}
              progressBackgroundColor="transparent"
            />
          }
        >
          {/* User Info Card */}
          <View style={styles.userCard}>
            {/* Pink Top Section */}
            <View style={styles.userCardTop}>
              <Text style={styles.userName}>{userData.username}</Text>
              <Text style={styles.usermobile}>{userData.mobile}</Text>
            </View>

            {/* Yellow Bottom Section */}
            <View style={styles.userCardBottom}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>₹ {balance.toFixed(1)}</Text>
            </View>
          </View>

          {/* QR Payment Section */}
          <Text style={styles.queryText}>Tap Below To Add Fund Via QR</Text>

          <View style={styles.contactButtonsRow}>
            {/* <TouchableOpacity style={styles.modernContactBtn} onPress={handleCall}>
              <View style={[styles.contactIconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="call" size={20} color="#1976D2" />
              </View>
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modernContactBtn} onPress={handleWhatsApp}>
              <View style={[styles.contactIconCircle, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#2E7D32" />
              </View>
              
              <Text style={styles.contactButtonText}>WhatsApp</Text>
            </TouchableOpacity> */}

            <TouchableOpacity style={[styles.modernContactBtn, { backgroundColor: '#FFFDE7' }]} onPress={handleQRScan}>
              <Animated.View style={{ opacity: blinkAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                <View style={[styles.contactIconCircle, { backgroundColor: '#FFEB3B' }]}>
                  <MaterialCommunityIcons name="qrcode-scan" size={24} color="#000" />
                </View>
                <Text style={[styles.contactButtonText, { color: '#6B3A3A' }]}>Pay With QR</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Amount Input Field */}
          {/* <View style={styles.inputContainer}>
            <View style={styles.inputIconCircle}>
              <MaterialCommunityIcons name="bank" size={22} color="#fff" />
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter Amount"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View> */}

          {/* Quick Amount Buttons */}
          {/* <View style={styles.quickAmountContainer}>
            <View style={styles.quickAmountRow}>
              {quickAmounts.slice(0, 2).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickAmountButton}
                  onPress={() => handleQuickAmount(value)}
                >
                  <Text style={styles.quickAmountText}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.quickAmountRow}>
              {quickAmounts.slice(2, 4).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickAmountButton}
                  onPress={() => handleQuickAmount(value)}
                >
                  <Text style={styles.quickAmountText}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.quickAmountRow}>
              {quickAmounts.slice(4, 6).map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickAmountButton}
                  onPress={() => handleQuickAmount(value)}
                >
                  <Text style={styles.quickAmountText}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View> */}

          {/* History Section */}
          <View style={styles.historySection}>
            {/* History Header */}
            <View style={styles.historyHeader}>
              <View style={styles.historyTitleRow}>
                <MaterialCommunityIcons name="clock-time-four" size={20} color="#C27183" />
                <Text style={styles.historyTitle}>Recent Requests</Text>
              </View>
              {loadingHistory && <View style={{ width: 20 }} />}
            </View>

            {/* History Tabs */}
            <View style={styles.historyTabs}>
              <TouchableOpacity
                style={[styles.historyTab, historyTab === 'accepted' && styles.historyTabActive]}
                onPress={() => setHistoryTab('accepted')}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color={historyTab === 'accepted' ? '#fff' : '#888'}
                />
                <Text style={[styles.historyTabText, historyTab === 'accepted' && styles.historyTabTextActive]}>Accepted</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.historyTab, historyTab === 'approve' && styles.historyTabActive]}
                onPress={() => setHistoryTab('approve')}
              >
                <Ionicons
                  name="time"
                  size={15}
                  color={historyTab === 'approve' ? '#fff' : '#888'}
                />
                <Text style={[styles.historyTabText, historyTab === 'approve' && styles.historyTabTextActive]}>Processing</Text>
              </TouchableOpacity>
            </View>

            {history.filter(item => {
              if (historyTab === 'accepted') return item.status === 'success';
              if (historyTab === 'approve') return item.status === 'processing';
              return false;
            }).length === 0 && !loadingHistory ? (
              <View style={styles.emptyHistory}>
                <MaterialCommunityIcons name="inbox-outline" size={48} color="#D0C4B0" />
                <Text style={styles.emptyHistoryText}>
                  No {historyTab === 'accepted' ? 'accepted' : 'processing'} requests found
                </Text>
              </View>
            ) : (
              history
                .filter(item => {
                  if (historyTab === 'accepted') return item.status === 'success';
                  if (historyTab === 'approve') return item.status === 'processing';
                  return false;
                })
                .map((item) => {
                  const isSuccess = item.status === 'success';
                  return (
                    <View key={item.id} style={[styles.historyCard, { borderLeftColor: isSuccess ? '#2E7D32' : '#EF6C00' }]}>
                      {/* Left icon */}
                      <View style={[styles.historyIcon, { backgroundColor: isSuccess ? '#E8F5E9' : '#FFF3E0' }]}>
                        <MaterialCommunityIcons
                          name={isSuccess ? 'check-circle' : 'clock-outline'}
                          size={24}
                          color={isSuccess ? '#2E7D32' : '#EF6C00'}
                        />
                      </View>

                      {/* Center info */}
                      <View style={styles.historyCardCenter}>
                        <Text style={styles.historyAmount}>₹ {item.amount}</Text>
                        <Text style={styles.historyDate}>{item.created_at}</Text>
                      </View>

                      {/* Right: status + refresh */}
                      <View style={styles.historyCardRight}>
                        <View style={[styles.statusPill, { backgroundColor: isSuccess ? '#E8F5E9' : '#FFF3E0' }]}>
                          <Text style={[styles.statusText, { color: isSuccess ? '#2E7D32' : '#EF6C00' }]}>
                            {isSuccess ? 'Accepted' : 'Processing'}
                          </Text>
                        </View>
                        {historyTab === 'approve' && (
                          <TouchableOpacity
                            style={styles.inlineRefreshBtn}
                            onPress={() => handleManualVerify(item.order_id, item.amount)}
                          >
                            <Ionicons name="refresh" size={13} color="#C27183" />
                            <Text style={styles.inlineRefreshText}>Refresh</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
            )}
          </View>
        </ScrollView>

        <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom + 10, 30) }]}>
          <TouchableOpacity
            style={[styles.payButton, submitting && { opacity: 0.7 }]}
            onPress={handleAddFund}
            disabled={submitting}
          >
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
        <CustomLoader visible={submitting || loadingHistory} />

      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          if (alertConfig.onPress) {
            alertConfig.onPress();
          }
          setAlertConfig({ ...alertConfig, visible: false, onPress: null });
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingTop: 45,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    fontWeight: 'bold',
  },
  historyBtn: {
    padding: 5,
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B8860B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  coinsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  userCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  userCardTop: {
    backgroundColor: '#C27183',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  usermobile: {
    fontSize: 26,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  userCardBottom: {
    backgroundColor: '#F5C34B',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 28,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  dividerContainer: {
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#D0C4B0',
  },
  queryText: {
    fontSize: 15,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginBottom: 30,
  },
  modernContactBtn: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  contactIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactButtonText: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#C27183',
    marginBottom: 20,
  },
  inputIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#C27183',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    paddingHorizontal: 15,
  },
  quickAmountContainer: {
    marginBottom: 20,
  },
  quickAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickAmountButton: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#F5EDE0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D0C4B0',
  },
  quickAmountText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  payButton: {
    backgroundColor: '#C27183',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  historySection: {
    marginTop: 10,
    marginBottom: 100, // Extra space for scroll
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#D0C4B0',
    paddingBottom: 5,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTitle: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    gap: 12,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCardLeft: {
    flex: 1,
  },
  historyCardCenter: {
    flex: 1,
  },
  historyCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  inlineRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C27183',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inlineRefreshText: {
    fontSize: 10,
    color: '#C27183',
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 3,
  },
  requestId: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 18,
    color: '#C27183',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
  },
  emptyHistory: {
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#999',
    fontFamily: 'Poppins_400Regular',
  },
  historyTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D0C4B0',
  },
  historyTab: {
    flex: 1,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 5,
  },
  historyTabActive: {
    backgroundColor: '#C27183',
    elevation: 2,
  },
  historyTabText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins_600SemiBold',
  },
  historyTabTextActive: {
    color: '#fff',
  },
});
