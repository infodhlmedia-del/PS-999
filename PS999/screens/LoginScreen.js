import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  Linking,
  BackHandler,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';
import CustomLoader from '../components/CustomLoader';
import ExitModal from '../components/ExitModal';

import logo from '../assets/logo/logo.png';
import { sendOtp, verifyOtp, LoginWithMPin, AdminContactDetailes } from '../api/auth';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('mobile'); // 'mobile' or 'otp'
  const [loginMode, setLoginMode] = useState('mpin'); // 'otp' or 'mpin' default to mpin as requested
  const [mpin, setMpin] = useState('');
  const [showMpin, setShowMpin] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [hasSavedMobile, setHasSavedMobile] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialChecking, setIsInitialChecking] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [adminContacts, setAdminContacts] = useState({
    call: '8149182874',
    whatsapp: '8149182874'
  });

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await AdminContactDetailes();
        if (response && response.status && response.data) {
          setAdminContacts({
            call: response.data.Call_Number || '8149182874',
            whatsapp: response.data.Whatsapp || '8149182874'
          });
        }
      } catch (err) {
        console.error('Error fetching admin contacts:', err);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    const checkSavedNumber = async () => {
      try {
        const saved = await AsyncStorage.getItem('userMobile');
        const hasPin = await AsyncStorage.getItem('hasSetMpin');

        if (saved) {
          setPhoneNumber(saved);
          setHasSavedMobile(true);
          // Only auto-switch to MPIN if they have actually set one
          if (hasPin === 'true') {
            setLoginMode('mpin');
          }
        }
      } catch (err) {
        console.error('Error reading saved mobile:', err);
      } finally {
        setIsInitialChecking(false);
      }
    };
    checkSavedNumber();
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      // 1. If we are in the OTP verification step, go back to mobile number entry
      if (loginMode === 'otp' && step === 'otp') {
        setStep('mobile');
        setOtp('');
        return true;
      }

      // 2. If we are in the OTP mode (entering number), go back to MPIN mode
      if (loginMode === 'otp') {
        setLoginMode('mpin');
        setStep('mobile');
        return true;
      }

      // 3. If we are in the primary MPIN mode, show the quit popup
      setShowExitModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, [loginMode, step]);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  const handleSendOtp = async () => {
    const finalPhone = phoneNumber.trim().replace(/\D/g, ''); // Remove any non-digits
    if (finalPhone.length === 10) {
      setIsLoading(true);
      try {
        console.log(`[AUTH] Requesting OTP for: ${finalPhone}`);

        const response = await sendOtp(finalPhone); // Token generation now handled inside sendOtp
        console.log('[AUTH] Send OTP response:', response);

        if (response && response.status === true) {
          setAlertConfig({
            visible: true,
            title: 'OTP Sent',
            message: 'OTP has been sent to your mobile number.',
            type: 'success'
          });
          setStep('otp');
        } else {
          // Check if user is not registered
          const isNotRegistered = response.message && (
            response.message.toLowerCase().includes('not register') ||
            response.message.toLowerCase().includes('not found') ||
            response.message.toLowerCase().includes('exist')
          );

          setAlertConfig({
            visible: true,
            title: isNotRegistered ? 'Not Registered' : 'OTP Failed',
            message: isNotRegistered ? 'This number is not registered. Please register first.' : 'Failed to send OTP. Please try again.',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('[AUTH] Send OTP error:', error);
        setAlertConfig({
          visible: true,
          title: 'Connection Error',
          message: 'Unable to connect. Please check your internet connection and try again.',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setAlertConfig({
        visible: true,
        title: finalPhone.length === 0 ? 'Number Required' : 'Invalid Number',
        message: finalPhone.length === 0 ? 'Please enter your mobile number.' : 'Please enter a valid 10-digit mobile number.',
        type: 'error'
      });
    }
  };


  const handleVerifyOtp = async () => {
    if (otp.length > 0) {
      setIsLoading(true);
      try {
        console.log(`[AUTH] Verifying OTP for: ${phoneNumber}`);

        // Pass token to verifyOtp (Optional now as it should be on server from sendOtp)
        const response = await verifyOtp(phoneNumber, otp);
        console.log('[AUTH] Verify OTP response:', response);

        if (response && response.status === true) {
          // Save user info from response
          await AsyncStorage.setItem('userMobile', phoneNumber);
          if (response.username) await AsyncStorage.setItem('userName', response.username);
          if (response.user_id) await AsyncStorage.setItem('userId', String(response.user_id));
          if (response.created_at) {
            const date = new Date(response.created_at);
            await AsyncStorage.setItem('userDate', date.toLocaleDateString('en-GB'));
          }

          navigation.replace('Home');



        } else {
          setAlertConfig({
            visible: true,
            title: 'Wrong OTP',
            message: 'The OTP you entered is incorrect. Please check and try again.',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Verify OTP Error:', error);
        setAlertConfig({
          visible: true,
          title: 'Connection Error',
          message: 'Unable to connect. Please check your internet connection and try again.',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setAlertConfig({
        visible: true,
        title: 'OTP Required',
        message: 'Please enter the OTP sent to your mobile number.',
        type: 'error'
      });
    }
  };

  const handleLoginWithMPin = async (manualMpin) => {
    const mpinToUse = manualMpin || mpin;
    if (phoneNumber.length === 10 && mpinToUse.length >= 4) {
      setIsLoading(true);
      try {
        const response = await LoginWithMPin(phoneNumber, mpinToUse);
        // console.log('MPIN Login Response:', response);

        if (response && response.status === true) {
          // Save user info from response
          await AsyncStorage.setItem('userMobile', phoneNumber);
          if (response.username) await AsyncStorage.setItem('userName', response.username);
          if (response.user_id) await AsyncStorage.setItem('userId', String(response.user_id));
          if (response.created_at) {
            const date = new Date(response.created_at);
            await AsyncStorage.setItem('userDate', date.toLocaleDateString('en-GB'));
          }
          // Note: Token generation removed from MPIN login as per user request
          navigation.replace('Home');
        } else if (response && response.otp_required === true) {
          // Handle the "First time login" case from PHP
          setAlertConfig({
            visible: true,
            title: 'OTP Verification Needed',
            message: 'First time login detected. Please verify with OTP for security.',
            type: 'success'
          });
          handleSendOtp(); // Automatically trigger OTP for them
          setLoginMode('otp');
          setStep('otp');
        } else {
          // Check if user is not registered
          const isNotRegistered = response.message && (
            response.message.toLowerCase().includes('not register') ||
            response.message.toLowerCase().includes('not found') ||
            response.message.toLowerCase().includes('exist')
          );

          setAlertConfig({
            visible: true,
            title: isNotRegistered ? 'Not Registered' : 'Wrong MPIN',
            message: isNotRegistered
              ? 'User not registered. Please register first.'
              : 'You entered a wrong MPIN. Please check and try again.',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('MPIN Login Error:', error);
        setAlertConfig({
          visible: true,
          title: 'Connection Error',
          message: 'Unable to connect. Please check your internet connection and try again.',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      let errorTitle = 'Missing Details';
      let errorMessage = 'Please enter your MPIN.';
      
      // If the phone number is already saved/visible as "Welcome back", 
      // we should only talk about MPIN if that's what's missing.
      if (hasSavedMobile) {
        if (mpinToUse.length === 0) {
          errorTitle = 'MPIN Required';
          errorMessage = 'Please enter your 4-digit MPIN.';
        } else if (mpinToUse.length < 4) {
          errorTitle = 'Invalid MPIN';
          errorMessage = 'MPIN must be at least 4 digits.';
        } else if (phoneNumber.length !== 10) {
          // This case should ideally not happen if hasSavedMobile is true, 
          // but good to have as a fallback.
          errorTitle = 'Invalid Number';
          errorMessage = 'The saved mobile number is invalid. Please change it.';
        }
      } else {
        // Normal mode where both inputs are visible
        if (phoneNumber.length === 0 && mpinToUse.length === 0) {
          errorTitle = 'Missing Details';
          errorMessage = 'Please enter your mobile number and MPIN.';
        } else if (phoneNumber.length === 0) {
          errorTitle = 'Number Required';
          errorMessage = 'Please enter your mobile number.';
        } else if (phoneNumber.length !== 10) {
          errorTitle = 'Invalid Number';
          errorMessage = 'Please enter a valid 10-digit mobile number.';
        } else if (mpinToUse.length === 0) {
          errorTitle = 'MPIN Required';
          errorMessage = 'Please enter your 4-digit MPIN.';
        } else if (mpinToUse.length < 4) {
          errorTitle = 'Invalid MPIN';
          errorMessage = 'MPIN must be at least 4 digits.';
        }
      }

      setAlertConfig({
        visible: true,
        title: errorTitle,
        message: errorMessage,
        type: 'error'
      });
    }
  };

  const makeCall = () => {
    Linking.openURL(`tel:+91${adminContacts.call}`);
  };

  const openWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=+91${adminContacts.whatsapp}`);
  };

  if (isInitialChecking) {
    return <CustomLoader visible={true} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5C542" />
      <CustomLoader visible={isLoading} />

      <View style={styles.content}>
        {/* Icon/Logo Area */}
        <View style={styles.iconContainer}>
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {loginMode === 'mpin' ? (
          <>
            <Text style={styles.title}>LOGIN WITH MPIN</Text>

            {hasSavedMobile ? (
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#555' }}>
                  Welcome back, +91 {phoneNumber.substring(0, 2)}******{phoneNumber.substring(8)}
                </Text>
                <TouchableOpacity onPress={() => { setHasSavedMobile(false); setPhoneNumber(''); }}>
                  <Text style={{ color: '#C36578', fontFamily: 'Poppins_600SemiBold', fontSize: 12, marginTop: 5 }}>
                    Not you? Change Number
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <View style={styles.phoneIcon}>
                  <Ionicons name="phone-portrait" size={28} color="#fff" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.phoneIcon}>
                <Ionicons name="lock-closed" size={28} color="#fff" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter MPIN"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                secureTextEntry={!showMpin}
                maxLength={6}
                value={mpin}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  setMpin(cleaned);
                  if (cleaned.length === 4 && phoneNumber.length === 10 && !isLoading) {
                    handleLoginWithMPin(cleaned);
                  }
                }}
              />
              <TouchableOpacity onPress={() => setShowMpin(!showMpin)} style={styles.eyeIcon}>
                <Ionicons name={showMpin ? 'eye' : 'eye-off'} size={22} color="#999" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && { opacity: 0.7 }]}
              onPress={handleLoginWithMPin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setLoginMode('otp')}>
              <Text style={styles.signupLink}>Login with OTP instead</Text>
            </TouchableOpacity>
            <View style={{ marginBottom: 20 }} />
          </>
        ) : (
          step === 'mobile' ? (
            <>
              {/* Title */}
              <Text style={styles.title}>ENTER YOUR MOBILE NUMBER</Text>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <View style={styles.phoneIcon}>
                  <Ionicons name="phone-portrait" size={28} color="#fff" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && { opacity: 0.7 }, hasSavedMobile && { marginBottom: 15 }]}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setLoginMode('mpin')}>
                <Text style={[styles.signupLink, { marginBottom: 20 }]}>Login with MPIN instead</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Title */}
              <Text style={styles.title}>ENTER OTP SENT TO {phoneNumber}</Text>

              {/* OTP Input */}
              <View style={styles.inputContainer}>
                <View style={styles.phoneIcon}>
                  <Ionicons name="mail-open" size={28} color="#fff" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  secureTextEntry={!showOtp}
                  value={otp}
                  onChangeText={setOtp}
                />
                <TouchableOpacity onPress={() => setShowOtp(!showOtp)} style={styles.eyeIcon}>
                  <Ionicons name={showOtp ? 'eye' : 'eye-off'} size={22} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Verify OTP Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && { opacity: 0.7 }]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>

              {/* Resend OTP Link */}
              <TouchableOpacity onPress={handleSendOtp} disabled={isLoading}>
                <Text style={[styles.signupLink, { marginBottom: 20 }]}>Resend OTP</Text>
              </TouchableOpacity>

              {/* Back to Mobile Number */}
              <TouchableOpacity onPress={() => { setStep('mobile'); setOtp(''); }}>
                <Text style={styles.signupText}>Change Number</Text>
              </TouchableOpacity>
            </>
          )
        )}

        {/* Contact Buttons */}
        <View style={[styles.contactContainer, { marginBottom: Math.max(insets.bottom + 10, 20) }]}>
          <TouchableOpacity style={styles.contactButton} onPress={makeCall}>
            <Ionicons name="call" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.signupContactButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupContactText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          setAlertConfig({ ...alertConfig, visible: false });
        }}
      />
      <ExitModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5C542',
  },

  logo: {
    width: 120,
    height: 120,
  },

  content: {
    flex: 1,
    backgroundColor: '#F5EDE0',
    marginTop: 100,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 60,
    alignItems: 'center',
    paddingBottom: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#E5B83E',
  },
  checkCircle: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5C542',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    width: '100%',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  phoneIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#C36578',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 18,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  eyeIcon: {
    paddingHorizontal: 15,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    width: '80%',
    backgroundColor: '#C36578',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 40,
  },
  contactButton: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  signupContactButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  signupContactText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#C36578',
    fontFamily: 'Poppins_600SemiBold',
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  signupLink: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
});
