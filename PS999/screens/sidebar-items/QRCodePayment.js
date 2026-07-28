import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QrcodePayment, paymentGetWay } from '../../api/auth';
import CustomAlert from '../../components/CustomAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_SIZE = SCREEN_WIDTH - 40; // full width minus horizontal padding

const injectedCSS = `
  (function() {
    var style = document.createElement('style');
    style.innerHTML = 'body,html{margin:0;padding:0;background:#fff;} img{width:100%!important;height:auto!important;display:block;}';
    document.head.appendChild(style);
  })();
  true;
`;

export default function QRCodePayment({ navigation }) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [utrCode, setUtrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [selectedUpiUrl, setSelectedUpiUrl] = useState('');

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
    onPress: null,
  });

  React.useEffect(() => {
    const getUserData = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        const name = await AsyncStorage.getItem('userName');
        if (id) setUserId(id);
        if (name) setUsername(name);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    getUserData();
  }, []);

  const handleQrPress = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setAlertConfig({
        visible: true,
        title: 'Amount Required',
        message: 'Please enter the amount first before tapping the QR code.',
        type: 'warning'
      });
      return;
    }

    let upiUrl = null;
    try {
      const pageRes = await fetch('https://dhlmedia.online/GoldenMatka/admin/Qr-PaymentLinkIMG.php');
      const pageHtml = await pageRes.text();
      const match = pageHtml.match(/<img[^>]+src=["']([^"']+)["']/);
      if (match && match[1]) {
        const imgUrl = match[1];
        const fullImgUrl = imgUrl.startsWith('http')
          ? imgUrl
          : `https://dhlmedia.online/GoldenMatka/admin/${imgUrl}`;

        const qrApiUrl = `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(fullImgUrl)}`;
        const qrRes = await fetch(qrApiUrl);
        const qrData = await qrRes.json();
        
        if (qrData && qrData[0]?.symbol[0]?.data) {
          const decodedUpi = qrData[0].symbol[0].data;
          if (decodedUpi && (decodedUpi.startsWith('upi://') || decodedUpi.startsWith('http'))) {
            upiUrl = decodedUpi;
            if (upiUrl.startsWith('upi://')) {
              if (upiUrl.includes('am=')) {
                upiUrl = upiUrl.replace(/am=[^&]*/, `am=${amount}`);
              } else {
                upiUrl += `&am=${amount}`;
              }
            }
          }
        }
      }
    } catch (err) {
      console.log('Error decoding dynamic QR code:', err);
    }

    if (!upiUrl) {
      try {
        const response = await paymentGetWay(userId, username, '', amount);
        if (response) {
          const potentialFields = [
            response.payment_url,
            response.url,
            response.redirect_url,
            response.upi,
            response.data?.url,
            response.data?.upi
          ];
          
          for (const field of potentialFields) {
            if (field && typeof field === 'string' && (field.startsWith('http') || field.startsWith('upi'))) {
              upiUrl = field;
              break;
            }
          }
        }
      } catch (err) {
        console.log('paymentGetWay fetch error, using fallback:', err);
      }
    }

    if (!upiUrl) {
      const adminUpi = 'raju82086@okhdfcbank';
      upiUrl = `upi://pay?pa=${adminUpi}&pn=PS999&am=${amount}&cu=INR`;
    }

    if (upiUrl && typeof upiUrl === 'string' && upiUrl.startsWith('upi://')) {
      if (upiUrl.includes('am=')) {
        upiUrl = upiUrl.replace(/am=[^&]*/, `am=${amount}`);
      } else {
        upiUrl += `&am=${amount}`;
      }
    }

    setSelectedUpiUrl(upiUrl || '');
    setShowAppSelector(true);
  };

  const openSelectedUpiApp = async (scheme) => {
    setShowAppSelector(false);
    let finalUrl = selectedUpiUrl;

    if (finalUrl && typeof finalUrl === 'string' && finalUrl.startsWith('upi://pay')) {
      finalUrl = finalUrl.replace('upi://pay', scheme);
    } else if (finalUrl && typeof finalUrl === 'string' && finalUrl.startsWith('upi://')) {
      finalUrl = finalUrl.replace('upi://', scheme.includes('?') ? scheme : scheme.replace('?pa=', ''));
    } else if (finalUrl && typeof finalUrl === 'string') {
      const matchPa = finalUrl.match(/pa=([^&]+)/);
      const pa = matchPa ? matchPa[1] : 'raju82086@okhdfcbank';
      finalUrl = `${scheme}?pa=${pa}&pn=PS999&am=${amount}&cu=INR`;
    } else {
      finalUrl = `${scheme}?pa=raju82086@okhdfcbank&pn=PS999&am=${amount}&cu=INR`;
    }

    try {
      await Linking.openURL(encodeURI(finalUrl));
    } catch (error) {
      console.error('Error opening selected UPI app:', error);
      try {
        const fallbackUrl = selectedUpiUrl && typeof selectedUpiUrl === 'string' && selectedUpiUrl.startsWith('http') 
          ? selectedUpiUrl 
          : selectedUpiUrl && typeof selectedUpiUrl === 'string' && selectedUpiUrl.startsWith('upi://') 
            ? selectedUpiUrl 
            : `upi://pay?pa=raju82086@okhdfcbank&pn=PS999&am=${amount}&cu=INR`;
        await Linking.openURL(encodeURI(fallbackUrl));
      } catch (e) {
        setAlertConfig({
          visible: true,
          title: 'Payment Error',
          message: 'Could not open UPI apps on your device. Please enter the UTR manually.',
          type: 'error'
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setAlertConfig({
        visible: true,
        title: 'Invalid Amount',
        message: 'Please enter the amount you paid.',
        type: 'warning'
      });
      return;
    }
    if (utrCode.trim().length !== 12) {
      setAlertConfig({
        visible: true,
        title: 'Invalid UTR',
        message: 'UTR number must be exactly 12 digits.',
        type: 'warning'
      });
      return;
    }

    if (!userId || !username) {
      setAlertConfig({
        visible: true,
        title: 'Session Error',
        message: 'User information not found. Please log in again.',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await QrcodePayment(
        userId,
        username,
        amount,
        utrCode.trim()
      );

      if (response && response.status) {
        setAlertConfig({
          visible: true,
          title: 'Success!',
          message: response.message || 'Fund request submitted successfully.',
          type: 'success',
          onPress: () => navigation.goBack()
        });
        setAmount('');
        setUtrCode('');
      } else {
        setAlertConfig({
          visible: true,
          title: 'Request Failed',
          message: response.message || 'This UTR number has already been used.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Submit Payment Error:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Something went wrong. Please try again later.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay via QR</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* QR WebView — full width */}
        <View style={styles.qrCard}>
          <Text style={styles.qrLabel}>Scan QR to Pay</Text>
          <TouchableOpacity 
            style={styles.qrWrapper} 
            activeOpacity={0.9}
            onPress={handleQrPress}
          >
            {qrLoading && (
              <ActivityIndicator size="large" color="#C27183" style={styles.qrLoader} />
            )}
            <WebView
              source={{ uri: 'https://dhlmedia.online/GoldenMatka/admin/Qr-PaymentLinkIMG.php' }}
              style={[styles.qrWebView, qrLoading && { opacity: 0 }]}
              injectedJavaScript={injectedCSS}
              onLoad={() => setQrLoading(false)}
              onError={() => setQrLoading(false)}
              scrollEnabled={false}
              scalesPageToFit={false}
              javaScriptEnabled={true}
              pointerEvents="none" 
            />
            {/* Overlay to ensure click works over WebView */}
            <View style={styles.qrOverlay} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.payUpiBtn} 
            activeOpacity={0.8}
            onPress={handleQrPress}
          >
            <Ionicons name="flash" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.payUpiBtnText}>Pay via UPI App</Text>
          </TouchableOpacity>
          <Text style={styles.qrNote}>Or tap QR code above to pay directly</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <View style={styles.inputRow}>
            <View style={styles.inputIcon}>
              <MaterialCommunityIcons name="currency-inr" size={20} color="#fff" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter amount "
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* UTR Input */}
        <View style={styles.section}>
          <View style={styles.inputRow}>
            <View style={styles.inputIcon}>
              <Ionicons name="receipt-outline" size={20} color="#fff" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter 12-digit UTR ID"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={12}
              value={utrCode}
              onChangeText={setUtrCode}
            />
          </View>
        </View>

      </ScrollView>

      {/* Fixed Submit Button at bottom */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 10, 14) }]}>
        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit for Verification</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* QR Modal Popup */}
      <Modal
        visible={showQrModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => setShowQrModal(false)}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.largeQrWrapper}>
              <WebView
                source={{ uri: 'https://dhlmedia.online/GoldenMatka/admin/Qr-PaymentLinkIMG.php' }}
                style={styles.largeQrWebView}
                injectedJavaScript={injectedCSS}
                scrollEnabled={false}
                scalesPageToFit={false}
                javaScriptEnabled={true}
              />
            </View>
            <Text style={styles.modalNote}>Scan this QR code from any UPI app</Text>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          if (alertConfig.onPress) alertConfig.onPress();
          setAlertConfig({ ...alertConfig, visible: false, onPress: null });
        }}
      />

      {/* App Selector Modal Popup */}
      <Modal
        visible={showAppSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAppSelector(false)}
      >
        <View style={styles.appSelectorOverlay}>
          <View style={styles.appSelectorSheet}>
            <Text style={styles.appSelectorTitle}>Choose Your Payment App</Text>
            
            <TouchableOpacity 
              style={[styles.appSelectorItem, { backgroundColor: '#5f259f' }]} 
              activeOpacity={0.8}
              onPress={() => openSelectedUpiApp('phonepe://pay')}
            >
              <Ionicons name="phone-portrait-outline" size={28} color="#fff" style={styles.appIcon} />
              <Text style={styles.appSelectorItemText}>PhonePe</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.appSelectorItem, { backgroundColor: '#1a73e8' }]} 
              activeOpacity={0.8}
              onPress={() => openSelectedUpiApp('tez://upi/pay')}
            >
              <Ionicons name="logo-google" size={28} color="#fff" style={styles.appIcon} />
              <Text style={styles.appSelectorItemText}>Google Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.appSelectorItem, { backgroundColor: '#00baf2' }]} 
              activeOpacity={0.8}
              onPress={() => openSelectedUpiApp('paytmmp://pay')}
            >
              <Ionicons name="wallet-outline" size={28} color="#fff" style={styles.appIcon} />
              <Text style={styles.appSelectorItemText}>Paytm</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.appSelectorItem, { backgroundColor: '#C27183' }]} 
              activeOpacity={0.8}
              onPress={() => openSelectedUpiApp('upi://pay')}
            >
              <Ionicons name="cash-outline" size={28} color="#fff" style={styles.appIcon} />
              <Text style={styles.appSelectorItemText}>Other UPI Apps</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.appSelectorCancelBtn} 
              activeOpacity={0.8}
              onPress={() => setShowAppSelector(false)}
            >
              <Text style={styles.appSelectorCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#F5EDE0',
    paddingTop: 45,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F5EDE0',
    borderTopWidth: 1,
    borderTopColor: '#e0d5c8',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 0,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  qrWrapper: {
    width: QR_SIZE,
    height: QR_SIZE + 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  qrLoader: {
    position: 'absolute',
  },
  qrWebView: {
    width: QR_SIZE,
    height: QR_SIZE + 100,
    backgroundColor: '#fff',
  },
  qrNote: {
    marginTop: 12,
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  payUpiBtn: {
    backgroundColor: '#C27183',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    elevation: 2,
    shadowColor: '#C27183',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  payUpiBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    fontFamily: 'Poppins_600SemiBold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  inputIcon: {
    backgroundColor: '#C27183',
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#333',
    height: 50,
  },
  submitBtn: {
    backgroundColor: '#C27183',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#C27183',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH - 50,
    backgroundColor: 'transparent',
    alignItems: 'center',
    // height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: -50,
    right: 0,
    zIndex: 10,
  },
  largeQrWrapper: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40 + 200,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
  },
  largeQrWebView: {
    flex: 1,
  },
  modalNote: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  appSelectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  appSelectorSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: 380,
  },
  appSelectorTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  appSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  appIcon: {
    marginRight: 12,
  },
  appSelectorItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  appSelectorCancelBtn: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  appSelectorCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
});
