import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, placeRedJodiBet, getMarkets } from '../../../api/auth';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Alert, Modal, Dimensions, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../../components/CustomAlert';


const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const MarqueeText = ({ text, style }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [textWidth, setTextWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        if (textWidth > 0 && containerWidth > 0) {
            animatedValue.setValue(containerWidth);
            Animated.loop(
                Animated.timing(animatedValue, {
                    toValue: -textWidth,
                    duration: 8000,
                    easing: Easing.linear,
                    useNativeDriver: true
                })
            ).start();
        }
    }, [textWidth, containerWidth]);

    return (
        <View
            style={{ flex: 1, overflow: 'hidden', alignItems: 'center', marginHorizontal: 10 }}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
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

export default function RedJodiGame({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { gameName, marketId, marketName, isOpenAvailable = true, isCloseAvailable = true } = route.params || { gameName: 'RED JODI' };

    const [balance, setBalance] = useState(0.0);
    const [currentMarketId, setCurrentMarketId] = useState(marketId);
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onClose: null
    });

    const [showDropdown, setShowDropdown] = useState(false);
    const [jodiPoints, setJodiPoints] = useState({});

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
            if (response && (response.status === true || response.status === 'true')) {
                // Robust market search: try marketName first, then falls back to gameName
                const searchName = (marketName || gameName).trim().toUpperCase();
                const currentMarket = response.data.find(m =>
                    m.market_name.trim().toUpperCase() === searchName ||
                    m.market_name.trim().toUpperCase() === gameName.trim().toUpperCase()
                );

                if (currentMarket) {
                    setCurrentMarketId(currentMarket.id);
                    console.log('Market fetched and updated for RedJodi:', currentMarket.id, currentMarket.market_name);
                } else {
                    console.log('Market not found in list for:', searchName);
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

    const gameOptions = [
        ...(isOpenAvailable ? ['OPEN'] : []),
        ...(isCloseAvailable ? ['CLOSE'] : [])
    ];

    const [selectedGameType, setSelectedGameType] = useState(gameOptions[0] || 'OPEN');

    const handlePointChange = (jodi, value) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        setJodiPoints(prev => ({
            ...prev,
            [jodi]: cleanValue
        }));
    };

    const getValidBets = () => {
        return Object.entries(jodiPoints)
            .filter(([_, points]) => points && parseInt(points) > 0)
            .map(([jodi, points]) => ({
                jodi,
                points: parseInt(points),
                session: selectedGameType
            }));
    };

    const totalBids = getValidBets().length;
    const totalPoints = getValidBets().reduce((sum, bet) => sum + bet.points, 0);

    const handleSubmit = () => {
        if (totalBids === 0) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Please enter points for at least one jodi',
                type: 'error'
            });
            return;
        }


        if (!currentMarketId) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Market ID missing. Please go back and try again.',
                type: 'error'
            });
            return;
        }


        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {
        setLoading(true);
        setShowConfirmModal(false);

        try {
            const userId = await AsyncStorage.getItem('userId');
            const username = await AsyncStorage.getItem('userName') || await AsyncStorage.getItem('userMobile');

            if (!userId) {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: 'User ID not found. Please login again.',
                    type: 'error'
                });
                setLoading(false);
                return;
            }


            const validBets = getValidBets();
            // Format bids: include 'type' as it might be required for validation
            const formattedBids = validBets.map(bet => ({
                digit: bet.jodi,
                points: bet.points,
                session: bet.session,
                type: "Red Jodi"
            }));

            console.log('Submitting Red Jodi Bets:', {
                userId,
                username,
                bids: formattedBids,
                marketName: marketName || gameName,
                marketId: String(currentMarketId),
                totalPoints
            });

            const response = await placeRedJodiBet(
                userId,
                username,
                formattedBids,
                marketName || gameName,
                String(currentMarketId),
                totalPoints
            );

            // console.log('Red Jodi Submit Response:', response);

            if (response && (response.status === true || response.status === 'true' || response.status === 'success')) {
                fetchBalance();
                setJodiPoints({});
                setAlertConfig({
                    visible: true,
                    title: 'Success',
                    message: `${totalBids} bets placed successfully!`,
                    type: 'success'
                });
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: response?.message || 'Validation error from server. Please try again.',
                    type: 'error'
                });
            }

        } catch (error) {
            console.error('Error in handleConfirmSubmit:', error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'An unexpected error occurred. Please try again.',
                type: 'error'
            });
        } finally {

            setLoading(false);
        }
    };

    const getCurrentDate = () => {
        const date = new Date();
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    };

    const renderJodiRow = (jodi1, jodi2) => {
        return (
            <View key={`${jodi1}-${jodi2}`} style={styles.jodiRow}>
                <View style={styles.jodiContainer}>
                    <View style={styles.jodiNumberBox}>
                        <Text style={styles.jodiNumberText}>{jodi1}</Text>
                    </View>
                    <TextInput
                        style={styles.jodiInput}
                        placeholder=""
                        placeholderTextColor="#999"
                        keyboardType="number-pad"
                        value={jodiPoints[jodi1] || ''}
                        onChangeText={(value) => handlePointChange(jodi1, value)}
                    />
                </View>
                {jodi2 && (
                    <View style={styles.jodiContainer}>
                        <View style={styles.jodiNumberBox}>
                            <Text style={styles.jodiNumberText}>{jodi2}</Text>
                        </View>
                        <TextInput
                            style={styles.jodiInput}
                            placeholder=""
                            placeholderTextColor="#999"
                            keyboardType="number-pad"
                            value={jodiPoints[jodi2] || ''}
                            onChangeText={(value) => handlePointChange(jodi2, value)}
                        />
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <MarqueeText text={`${gameName} - RED JODI`} style={styles.headerTitle} />
                <View style={styles.balanceChip}>
                    <Ionicons name="wallet" size={16} color="#fff" />
                    <Text style={styles.balanceText}>{balance.toFixed(1)}</Text>
                </View>
            </View>

            <View style={styles.staticContent}>
                <View style={styles.topRow}>
                    <View style={styles.datePickerBtn}>
                        <Ionicons name="calendar-outline" size={18} color="#C36578" />
                        <Text style={styles.dateText}>{getCurrentDate()}</Text>
                    </View>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(true)}>
                        <Text style={styles.dropdownText}>{selectedGameType}</Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={styles.scrollableContent} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.jodiGrid}>
                    {renderJodiRow('00', '05')}
                    {renderJodiRow('11', '16')}
                    {renderJodiRow('22', '27')}
                    {renderJodiRow('33', '38')}
                    {renderJodiRow('44', '49')}
                    {renderJodiRow('50', '55')}
                    {renderJodiRow('61', '66')}
                    {renderJodiRow('72', '77')}
                    {renderJodiRow('83', '88')}
                    {renderJodiRow('94', '99')}
                </View>
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 15), height: 75 + insets.bottom }]}>
                <View style={styles.totalSection}>
                    <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>Bids</Text>
                        <Text style={styles.totalValue}>{totalBids}</Text>
                    </View>
                    <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>Points</Text>
                        <Text style={styles.totalValue}>{totalPoints}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>SUBMIT</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showConfirmModal} transparent={true} animationType="fade" onRequestClose={() => setShowConfirmModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.confirmTitle}>Confirm Submission</Text>
                        <Text style={styles.confirmSubtitle}>Total Bids: {totalBids} | Total Points: {totalPoints}</Text>

                        <ScrollView style={styles.confirmList} showsVerticalScrollIndicator={true}>
                            <View style={styles.confirmTableHeader}>
                                <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Jodi</Text>
                                <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Point</Text>
                                <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Type</Text>
                            </View>
                            {getValidBets().map((bet, index) => (
                                <View key={`${bet.jodi}-${index}`} style={styles.confirmRow}>
                                    <Text style={[styles.confirmCell, { flex: 1 }]}>{bet.jodi}</Text>
                                    <Text style={[styles.confirmCell, { flex: 1 }]}>{bet.points}</Text>
                                    <Text style={[styles.confirmCell, { flex: 1 }]}>{bet.session}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.cancelButton]}
                                onPress={() => setShowConfirmModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, styles.confirmSubmitButton]}
                                onPress={handleConfirmSubmit}
                                disabled={loading}
                            >
                                <Text style={styles.confirmSubmitButtonText}>
                                    {loading ? 'Processing...' : 'Confirm'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showDropdown} transparent={true} animationType="fade" onRequestClose={() => setShowDropdown(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Game Type</Text>
                        {gameOptions.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.modalOption, selectedGameType === type && styles.modalOptionSelected]}
                                onPress={() => {
                                    setSelectedGameType(type);
                                    setShowDropdown(false);
                                }}
                            >
                                <Text style={[styles.modalOptionText, selectedGameType === type && styles.modalOptionTextSelected]}>
                                    {type}
                                </Text>
                                {selectedGameType === type && <Ionicons name="checkmark-circle" size={22} color="#2E4A3E" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
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
        backgroundColor: '#F5EDE0'
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
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    scrollableContent: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 150,
    },
    topRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    datePickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30, gap: 8 },
    dateText: { fontSize: 14, color: '#000', fontWeight: '500' },
    dropdown: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30 },
    dropdownText: { fontSize: 14, color: '#000', fontWeight: '500' },
    jodiGrid: { gap: 8 },
    jodiRow: { flexDirection: 'row', gap: 10 },
    jodiContainer: { flex: 1, flexDirection: 'row', height: 40 },
    jodiNumberBox: { backgroundColor: '#C36578', width: 50, justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
    jodiNumberText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    jodiInput: { flex: 1, backgroundColor: '#fff', borderTopRightRadius: 8, borderBottomRightRadius: 8, textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#000', borderWidth: 1, borderColor: '#D0D0D0' },
    bottomBar: { flexDirection: 'row', backgroundColor: '#F5EDE0', paddingHorizontal: 16, paddingVertical: 15, borderTopWidth: 2, borderTopColor: '#C36578', alignItems: 'center', gap: 12, position: 'absolute', bottom: 0, left: 0, right: 0 },
    totalSection: { flexDirection: 'row', flex: 1, gap: 20 },
    totalItem: { alignItems: 'center', flex: 1 },
    totalLabel: { fontSize: 14, color: '#666', marginBottom: 4, fontWeight: '500' },
    totalValue: { fontSize: 22, fontWeight: '700', color: '#000' },
    submitButton: { backgroundColor: '#C36578', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center', minWidth: 140 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    confirmModal: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: SCREEN_WIDTH * 0.9, maxHeight: SCREEN_HEIGHT * 0.7 },
    confirmTitle: { fontSize: 20, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 8 },
    confirmSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, fontWeight: '500' },
    confirmList: { maxHeight: SCREEN_HEIGHT * 0.4, marginBottom: 16 },
    confirmTableHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#C36578', marginBottom: 8 },
    confirmHeaderText: { fontSize: 14, fontWeight: '600', color: '#C36578', textAlign: 'center' },
    confirmRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
    confirmCell: { fontSize: 14, color: '#000', textAlign: 'center', fontWeight: '500' },
    confirmButtons: { flexDirection: 'row', gap: 12 },
    confirmButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    cancelButton: { backgroundColor: '#E8E8E8' },
    cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
    confirmSubmitButton: { backgroundColor: '#C36578' },
    confirmSubmitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 24, paddingHorizontal: 20, width: SCREEN_WIDTH * 0.8, maxWidth: 320 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 20 },
    modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, marginBottom: 12, backgroundColor: '#F5EDE0', borderWidth: 2, borderColor: '#E8E8E8' },
    modalOptionSelected: { backgroundColor: '#E8F5E9', borderColor: '#2E4A3E' },
    modalOptionText: { fontSize: 16, fontWeight: '600', color: '#333' },
    modalOptionTextSelected: { color: '#2E4A3E' }
});
