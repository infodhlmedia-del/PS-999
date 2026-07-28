import React, { useState, useEffect } from 'react';
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
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';
import CustomLoader from '../components/CustomLoader';


import logo from '../assets/logo/logo.png';
import { registerUser } from '../api/auth';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showMpin, setShowMpin] = useState(false);

  const [isLoading, setIsLoading] = useState(false);



  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  useEffect(() => {
    const handleBackPress = () => {
      navigation.goBack();
      return true; // prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, [navigation]);

  const handleRegister = async () => { 
    if (phone && username && password) {
      if (username.length <= 4) {
        setAlertConfig({
          visible: true,
          title: 'Invalid Username',
          message: 'Username must be more than 5 characters long.',
          type: 'error'
        });
        return;
      }
      if (password.length !== 4) {
        setAlertConfig({
          visible: true,
          title: 'Invalid MPIN',
          message: 'MPIN must be exactly 4 digits.',
          type: 'error'
        });
        return;
      }
      setIsLoading(true);
      try {
        const response = await registerUser(username, password, phone); // No token generation here per user request
        // console.log('Register response:', response);

        if (response && (response.status === 'true' || response.status === true)) {
          // Save credentials locally for local login check
          try {
            await AsyncStorage.setItem('userMobile', phone);
            await AsyncStorage.setItem('userPassword', password);
            await AsyncStorage.setItem('userName', username);

            // Save current date as registration date if API doesn't provide it
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-GB'); // DD/MM/YYYY
            await AsyncStorage.setItem('userDate', dateStr);

            if (response.user_id) {
              await AsyncStorage.setItem('userId', String(response.user_id));
            }

            // console.log('Credentials and user info saved locally');
          } catch (e) {
            console.error('Failed to save credentials', e);
          }

          setAlertConfig({
            visible: true,
            title: 'Success',
            message: 'Registration Successful! Please Login.',
            type: 'success'
          });

        } else {
          setAlertConfig({
            visible: true,
            title: 'Registration Failed',
            message: response.message || 'Registration failed. Please try again.',
            type: 'error'
          });
        }

      } catch (error) {
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
      let errorMessage = 'Please fill in all fields.';
      if (!phone && !username && !password) {
        errorMessage = 'Please fill in all fields - Phone, Username and MPIN.';
      } else if (!phone) {
        errorMessage = 'Please enter your mobile number.';
      } else if (!username) {
        errorMessage = 'Please enter a username.';
      } else if (!password) {
        errorMessage = 'Please enter a 4-digit MPIN.';
      }

      setAlertConfig({
        visible: true,
        title: 'Missing Details',
        message: errorMessage,
        type: 'error'
      });
    }

  };

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

        {/* Title */}
        <Text style={styles.title}>CREATE NEW ACCOUNT</Text>

        {/* Phone Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Ionicons name="phone-portrait" size={24} color="#C36578" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Username Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Ionicons name="person" size={24} color="#C36578" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={(text) => setUsername(text.replace(/\s/g, ''))}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Ionicons name="lock-closed" size={24} color="#C36578" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Mpin (4 digits)"
            secureTextEntry={!showMpin}
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={4}
            value={password}
            onChangeText={(text) => setPassword(text.replace(/[^0-9]/g, ''))}
          />
          <TouchableOpacity onPress={() => setShowMpin(!showMpin)} style={styles.eyeIcon}>
            <Ionicons name={showMpin ? 'eye' : 'eye-off'} size={22} color="#999" />
          </TouchableOpacity>
        </View>



        {/* Register Button */}
        <TouchableOpacity
          style={[styles.registerButton, isLoading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.registerButtonText}>
            {isLoading ? 'Registering...' : 'Register & Login'}
          </Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Already have an account? Login</Text>
        </TouchableOpacity>
        <View style={{ height: Math.max(insets.bottom + 10, 20) }} />
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.title === 'Success') {
            navigation.replace('Login');
          }
        }}
      />
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5C542',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5EDE0',
    marginTop: 100,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  iconCircle: {
    width: 100,
    height: 100,
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
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 25,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '100%',
    marginBottom: 15,
    paddingLeft: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    paddingRight: 15,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  eyeIcon: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButton: {
    width: '90%',
    backgroundColor: '#C36578',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins_600SemiBold',
  },
  backText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
});
