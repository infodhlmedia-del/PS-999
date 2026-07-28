import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    TextInput,
    ScrollView
} from 'react-native';
import CustomLoader from '../../components/CustomLoader';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginWithMPin } from '../../api/auth'; // Using this as a check or placeholder

export default function MpinScreen({ navigation }) {
    const [mpin, setMpin] = useState('');
    const [showMpin, setShowMpin] = useState(false);
    const [confirmMpin, setConfirmMpin] = useState('');
    const [showConfirmMpin, setShowConfirmMpin] = useState(false);
    const [loading, setLoading] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onClose: null
    });

    const handleGenerateMpin = async () => {
        if (mpin.length === 0) {
            setAlertConfig({
                visible: true,
                title: 'MPIN Required',
                message: 'Please enter a 4-6 digit MPIN.',
                type: 'error'
            });
            return;
        }

        if (mpin.length < 4) {
            setAlertConfig({
                visible: true,
                title: 'Invalid MPIN',
                message: 'MPIN must be at least 4 digits.',
                type: 'error'
            });
            return;
        }

        if (mpin !== confirmMpin) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'MPIN and Confirm MPIN do not match',
                type: 'error'
            });
            return;
        }

        setLoading(true);
        try {
            // Since we don't have a dedicated setMpin API yet, 
            // we will simulate success or call a hypothetical endpoint if we knew it.
            // For now, let's just save it locally so the login screen can use it.
            
            // In a real app, you'd call: await generateMpin(userId, mpin);
            
            // Save MPIN setup flag locally so login screen knows to show MPIN mode
            await AsyncStorage.setItem('hasSetMpin', 'true');

            // Simulating API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            setAlertConfig({
                visible: true,
                title: 'Success',
                message: 'MPIN Generated Successfully!',
                type: 'success',
                onClose: () => navigation.goBack()
            });
        } catch (error) {
            console.error('MPIN Generation Error:', error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Failed to generate MPIN. Please try again.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#C36578" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Generate MPIN</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark" size={30} color="#4CAF50" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoTitle}>Secure Your Account</Text>
                        <Text style={styles.infoText}>Create a 4-6 digit MPIN for faster and secure login next time.</Text>
                    </View>
                </View>

                {/* MPIN Input */}
                <Text style={styles.label}>Enter New MPIN</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#C36578" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter 4-6 digit MPIN"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        secureTextEntry={!showMpin}
                        maxLength={6}
                        value={mpin}
                        onChangeText={(text) => setMpin(text.replace(/[^0-9]/g, ''))}
                    />
                    <TouchableOpacity onPress={() => setShowMpin(!showMpin)} style={styles.eyeToggle}>
                        <Ionicons name={showMpin ? 'eye' : 'eye-off'} size={20} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Confirm MPIN Input */}
                <Text style={styles.label}>Confirm MPIN</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#C36578" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm your MPIN"
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        secureTextEntry={!showConfirmMpin}
                        maxLength={6}
                        value={confirmMpin}
                        onChangeText={(text) => setConfirmMpin(text.replace(/[^0-9]/g, ''))}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmMpin(!showConfirmMpin)} style={styles.eyeToggle}>
                        <Ionicons name={showConfirmMpin ? 'eye' : 'eye-off'} size={20} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && { opacity: 0.8 }]}
                    onPress={handleGenerateMpin}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>Generate MPIN Now</Text>
                </TouchableOpacity>

                <CustomLoader visible={loading} />

                {/* Security Tips */}
                <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>Security Tips:</Text>
                    <Text style={styles.tipText}>• Don't use easy patterns like 1234 or 0000.</Text>
                    <Text style={styles.tipText}>• Never share your MPIN with anyone.</Text>
                    <Text style={styles.tipText}>• Change your MPIN regularly for better security.</Text>
                </View>
            </ScrollView>

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
        backgroundColor: '#C36578',
        paddingHorizontal: 15,
        paddingVertical: 15,
        paddingTop: 45,
        elevation: 4,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
    content: {
        padding: 25,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        marginBottom: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    infoTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        fontFamily: 'Poppins_600SemiBold',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        fontFamily: 'Poppins_600SemiBold',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        fontFamily: 'Poppins_600SemiBold',
        marginLeft: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 25,
        height: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#eee',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        letterSpacing: 2,
        fontFamily: 'Poppins_600SemiBold',
    },
    eyeToggle: {
        paddingHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButton: {
        backgroundColor: '#C36578',
        borderRadius: 30,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#C36578',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
    tipsContainer: {
        marginTop: 40,
        backgroundColor: 'rgba(195, 101, 120, 0.05)',
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(195, 101, 120, 0.2)',
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#C36578',
        marginBottom: 10,
        fontFamily: 'Poppins_600SemiBold',
    },
    tipText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
        lineHeight: 18,
        fontFamily: 'Poppins_600SemiBold',
    },
});
