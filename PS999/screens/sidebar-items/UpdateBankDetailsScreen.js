import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateBankDetails, getBankDetails } from '../../api/auth';
import { useFocusEffect } from '@react-navigation/native';
import CustomAlert from '../../components/CustomAlert';


const InputField = ({ icon, placeholder, value, onChangeText, keyboardType = 'default', iconType = 'Ionicons' }) => (
    <View style={styles.inputContainer}>
        <View style={styles.iconCircle}>
            {iconType === 'Ionicons' ? (
                <Ionicons name={icon} size={20} color="#fff" />
            ) : iconType === 'MaterialCommunityIcons' ? (
                <MaterialCommunityIcons name={icon} size={20} color="#fff" />
            ) : (
                <FontAwesome5 name={icon} size={18} color="#fff" />
            )}
        </View>
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholderTextColor="#999"
        />
    </View>
);

const FullScreenLoader = () => (
    <View style={styles.fullScreenLoader}>
        <ActivityIndicator size="large" color="#C36578" />
        <Text style={styles.loaderText}>Fetching Saved Details...</Text>
    </View>
);

export default function UpdateBankDetailsScreen({ navigation }) {
    const [bankName, setBankName] = useState('');
    const [holderName, setHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [upi, setUpi] = useState('');
    const [paytm, setPaytm] = useState('');
    const [googlePay, setGooglePay] = useState('');
    const [phonePay, setPhonePay] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [username, setUsername] = useState('');
    const [hasDetails, setHasDetails] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
    });


    const fetchBankAndUserData = async (isInitial = false) => {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUsername = await AsyncStorage.getItem('userName');
        setUserId(storedUserId || '');
        const currentUsername = storedUsername || '';
        setUsername(currentUsername);
        
        // Auto-populate holder name with username if it's currently empty
        setHolderName(prev => prev || currentUsername);

        // 1. Try to load from Local Cache first (for immediate visibility)
        try {
            const cachedData = await AsyncStorage.getItem(`bankDetails_${storedUserId}`);
            if (cachedData) {
                const data = JSON.parse(cachedData);
                setBankName(data.bank_name || '');
                setHolderName(data.ac_holder_name || '');
                setAccountNumber(data.ac_number || '');
                setIfsc(data.ifsc_code || '');
                setUpi(data.upi || '');
                setPaytm(data.paytm || '');
                setGooglePay(data.google_pay || '');
                setPhonePay(data.phone_pay || '');
                setHasDetails(true); // Cache has details, so we start in 'update' mode
            }
        } catch (e) {

        }

        if (storedUserId) {
            try {
                if (isInitial) setInitialLoading(true);
                else setLoading(true);

                // Fetch and/or Initialize the bank record
                const response = await getBankDetails(storedUserId, currentUsername);
                // console.log('UpdateBankDetails: API Response:', response);

                if (response && (response.status === true || response.status === 'true')) {
                    // Handle both nested 'data' and flat response
                    const data = response.data || response;

                    // Verify that the returned data belongs to the current user
                    if (data && typeof data === 'object' && data.user_id && data.user_id !== storedUserId) {
                        setHasDetails(false);
                        setBankName('');
                        setHolderName(currentUsername);
                        setAccountNumber('');
                        setIfsc('');
                        setUpi('');
                        setPaytm('');
                        setGooglePay('');
                        setPhonePay('');
                        await AsyncStorage.removeItem(`bankDetails_${storedUserId}`);
                    } else if (data && typeof data === 'object') {
                        setBankName(data.bank_name || '');
                        
                        // Prioritize: Saved Holder Name > Response Username > Local Username
                        const suggestedHolderName = data.ac_holder_name || data.username || currentUsername || '';
                        setHolderName(suggestedHolderName);
                        
                        setAccountNumber(data.ac_number || '');
                        setIfsc(data.ifsc_code || '');
                        setUpi(data.upi || '');
                        setPaytm(data.paytm || '');
                        setGooglePay(data.google_pay || '');
                        setPhonePay(data.phone_pay || '');

                        setHasDetails(true);

                        // Update Local Cache
                        await AsyncStorage.setItem(`bankDetails_${storedUserId}`, JSON.stringify(data));
                    }
                } else {
                    setHasDetails(false);
                    // Clear fields if no details found in database
                    setBankName('');
                    setHolderName(username);
                    setAccountNumber('');
                    setIfsc('');
                    setUpi('');
                    setPaytm('');
                    setGooglePay('');
                    setPhonePay('');
                    
                    await AsyncStorage.removeItem(`bankDetails_${storedUserId}`);
                }
            } catch (error) {
                console.error('UpdateBankDetails: Fetch error', error);
                // Don't alert if we already have cached data to avoid annoyance
                const hasCache = await AsyncStorage.getItem(`bankDetails_${storedUserId}`);
                if (!hasCache) {
                    setAlertConfig({
                        visible: true,
                        title: 'Notice',
                        message: 'Using offline details. Please check connection.',
                        type: 'info'
                    });
                }

            } finally {
                setInitialLoading(false);
                setLoading(false);
            }
        } else {
            setInitialLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBankAndUserData(true);
        }, [])
    );

    const handleSave = async () => {
        setLoading(true);
        try {
            const details = {
                user_id: userId,
                username: username,
                action: 'update', // Corrected action from image
                bank_name: bankName,
                ac_holder_name: holderName,
                ac_number: accountNumber,
                ifsc_code: ifsc,
                upi: upi,
                paytm: paytm,
                google_pay: googlePay,
                phone_pay: phonePay,
            };

            const response = await updateBankDetails(details);

            if (response && (response.status === true || response.status === 'true' || response.status === 'success')) {
                // Save to Local Cache immediately on success
                await AsyncStorage.setItem(`bankDetails_${userId}`, JSON.stringify(details));
                setHasDetails(true); // Now we have details definitely

                setAlertConfig({
                    visible: true,
                    title: 'Success',
                    message: response.message || 'Bank details updated successfully',
                    type: 'success'
                });
                // stay on screen and refresh from server to ensure visibility

                fetchBankAndUserData(false);
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: response.message || 'Failed to update bank details',
                    type: 'error'
                });
            }

        } catch (error) {
            console.error('Update Bank Details Error:', error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'An error occurred while updating details',
                type: 'error'
            });
        } finally {

            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={{ flex: 1 }}>
                <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Update Bank Detail</Text>
                    <View style={{ width: 40 }} />
                </View>

                {initialLoading ? (
                    <FullScreenLoader />
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.label}>Bank Name</Text>
                        <InputField
                            icon="business"
                            placeholder="Bank Name"
                            value={bankName}
                            onChangeText={setBankName}
                        />
                        <Text style={styles.label}>Account Holder Name</Text>
                        <InputField
                            icon="person"
                            placeholder="Account Holder Name"
                            value={holderName}
                            onChangeText={setHolderName}
                        />
                        <Text style={styles.label}>Bank Account Number</Text>
                        <InputField
                            icon="university"
                            iconType="FontAwesome5"
                            placeholder="Bank Account number"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            keyboardType="numeric"
                        />
                        <Text style={styles.label}>IFSC Code</Text>
                        <InputField
                            icon="card-outline"
                            placeholder="IFSC"
                            value={ifsc}
                            onChangeText={setIfsc}
                        />

                        <View style={styles.divider}>
                            <Text style={styles.dividerText}>UPI & Digital Wallets</Text>
                        </View>

                        <Text style={styles.label}>UPI ID</Text>
                        <InputField
                            icon="at-circle-outline"
                            placeholder="UPI ID"
                            value={upi}
                            onChangeText={setUpi}
                        />
                        <Text style={styles.label}>Paytm Number</Text>
                        <InputField
                            icon="wallet-outline"
                            placeholder="Paytm Number"
                            value={paytm}
                            onChangeText={setPaytm}
                            keyboardType="numeric"
                        />
                        <Text style={styles.label}>Google Pay Number</Text>
                        <InputField
                            icon="logo-google"
                            iconType="Ionicons"
                            placeholder="Google Pay Number"
                            value={googlePay}
                            onChangeText={setGooglePay}
                            keyboardType="numeric"
                        />
                        <Text style={styles.label}>Phone Pe Number</Text>
                        <InputField
                            icon="phone-portrait-outline"
                            iconType="Ionicons"
                            placeholder="Phone Pe Number"
                            value={phonePay}
                            onChangeText={setPhonePay}
                            keyboardType="numeric"
                        />

                        <TouchableOpacity
                            style={[styles.saveButton, loading && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Detail</Text>
                            )}
                        </TouchableOpacity>




                        <View style={{ height: 30 }} />
                    </ScrollView>
                )}
            </View>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </KeyboardAvoidingView>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5EDE0',
    },
    fullScreenLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5EDE0',
    },
    loaderText: {
        marginTop: 10,
        fontSize: 16,
        color: '#C36578',
        fontFamily: 'Poppins_600SemiBold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        paddingTop: 45,
        backgroundColor: '#F5EDE0',
    },
    backButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        borderWidth: 1,
        borderColor: '#D3D3D3',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        fontFamily: 'Poppins_600SemiBold',
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 35,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 20,
        width: '100%',
        borderWidth: 2,
        borderColor: '#C36578',
        height: 65,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconCircle: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#C36578',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontFamily: 'Poppins_600SemiBold',
    },
    divider: {
        width: '100%',
        marginVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#D3D3D3',
        alignItems: 'center',
        paddingBottom: 5,
        marginBottom: 25,
    },
    dividerText: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
        fontFamily: 'Poppins_600SemiBold',
    },
    saveButton: {
        backgroundColor: '#C36578',
        width: '60%',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    disabledButton: {
        backgroundColor: '#A0A0A0',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins_600SemiBold',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        fontFamily: 'Poppins_600SemiBold',
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#C36578',
        fontWeight: '600',
        fontFamily: 'Poppins_600SemiBold',
        alignSelf: 'flex-start',
        marginLeft: 5,
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
