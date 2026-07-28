import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changePassword } from '../../api/auth';


export default function ChangePasswordScreen({ navigation }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onClose: null
    });


    const handleChangePassword = () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Please fill all fields',
                type: 'error'
            });
            return;
        }


        if (newPassword.length < 6) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'New password must be at least 6 characters',
                type: 'error'
            });
            return;
        }


        if (newPassword !== confirmPassword) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'New password and confirm password do not match',
                type: 'error'
            });
            return;
        }


        setLoading(true);

        const performChangePassword = async () => {
            try {
                const userId = await AsyncStorage.getItem('userId');
                if (!userId) {
                    setAlertConfig({
                        visible: true,
                        title: 'Error',
                        message: 'User session not found. Please login again.',
                        type: 'error'
                    });
                    setLoading(false);
                    return;
                }

                const response = await changePassword(userId, currentPassword, newPassword, confirmPassword);

                if (response.status === true || response.status === 'true') {
                    setAlertConfig({
                        visible: true,
                        title: 'Success',
                        message: response.message || 'Password changed successfully',
                        type: 'success',
                        onClose: () => navigation.goBack()
                    });
                } else {
                    setAlertConfig({
                        visible: true,
                        title: 'Error',
                        message: response.message || 'Failed to change password',
                        type: 'error'
                    });
                }
            } catch (error) {
                console.error('Change Password Error:', error);
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: 'Network error or server unavailable',
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        performChangePassword();

    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#C36578" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                    <Text style={styles.infoText}>Create a strong password with at least 6 characters</Text>
                </View>

                {/* Current Password */}
                <Text style={styles.label}>Current Password</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter current password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showCurrentPassword}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />
                    <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                        <Ionicons name={showCurrentPassword ? "eye" : "eye-off"} size={20} color="#888" />
                    </TouchableOpacity>
                </View>

                {/* New Password */}
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="key-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter new password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                        <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={20} color="#888" />
                    </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm new password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#888" />
                    </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Change Password</Text>
                    )}
                </TouchableOpacity>

                {/* Password Requirements */}
                <View style={styles.requirementsCard}>
                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                    <Text style={styles.requirementText}>• Minimum 6 characters</Text>
                    <Text style={styles.requirementText}>• Should not be same as current password</Text>
                    <Text style={styles.requirementText}>• Mix of letters and numbers recommended</Text>
                </View>
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
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        padding: 15,
        borderRadius: 12,
        marginBottom: 25,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        marginLeft: 12,
        fontFamily: 'Poppins_600SemiBold',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        fontFamily: 'Poppins_600SemiBold',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        height: 55,
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
        fontSize: 15,
        color: '#333',
        fontFamily: 'Poppins_600SemiBold',
    },
    submitButton: {
        backgroundColor: '#C36578',
        borderRadius: 12,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
    requirementsCard: {
        backgroundColor: '#FFF8E7',
        padding: 15,
        borderRadius: 12,
        marginTop: 25,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        fontFamily: 'Poppins_600SemiBold',
    },
    requirementText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 22,
        fontFamily: 'Poppins_600SemiBold',
    },
});
