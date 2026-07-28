import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, placeDPMotorBet, getMarkets } from '../../../api/auth';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Alert, Modal, Dimensions, Animated, Easing, FlatList } from 'react-native';
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

export default function DPMotorGame({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { gameName, marketId, marketName, isOpenAvailable = true, isCloseAvailable = true } = route.params || { gameName: 'DP MOTOR' };

    const [balance, setBalance] = useState(0.0);
    const [bids, setBids] = useState([]);
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
            if (response && (response.status === true || response.status === 'true')) {
                const currentMarket = response.data.find(m => m.market_name === gameName);
                if (currentMarket) {
                    setCurrentMarketId(currentMarket.id);
                    console.log('Market fetched and updated for DPMotor:', currentMarket.id);
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

    // Filter game options based on availability
    const gameOptions = [
        ...(isOpenAvailable ? ['OPEN'] : []),
        ...(isCloseAvailable ? ['CLOSE'] : [])
    ];

    const [selectedGameType, setSelectedGameType] = useState(gameOptions[0] || 'OPEN');
    const [showDropdown, setShowDropdown] = useState(false);
    const [digit, setDigit] = useState('');
    const [points, setPoints] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [tooltipMessage, setTooltipMessage] = useState('');
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipTarget, setTooltipTarget] = useState('digit'); // 'digit' or 'points'

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onClose: null
    });

    const showTooltipMessage = (message, target = 'digit') => {
        setTooltipMessage(message);
        setTooltipTarget(target);
        setShowTooltip(true);
        setTimeout(() => {
            setShowTooltip(false);
        }, 2000);
    };

    const getCurrentDate = () => {
        const date = new Date();
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    };

    const handleDigitChange = (text) => {
        const cleanText = text.replace(/[^0-9]/g, '');
        const uniqueText = [...new Set(cleanText.split(''))].join('');
        setDigit(uniqueText);
    };

    const generateDPCombinations = (digits) => {
        const uniqueDigits = digits.split('');
        const combinations = [];

        // Double Pana logic: [d1, d1, d2]
        for (let i = 0; i < uniqueDigits.length; i++) {
            for (let j = 0; j < uniqueDigits.length; j++) {
                if (i !== j) {
                    const d1 = uniqueDigits[i];
                    const d2 = uniqueDigits[j];
                    const p = [d1, d1, d2].sort().join('');
                    if (!combinations.includes(p)) {
                        combinations.push(p);
                    }
                }
            }
        }
        return combinations.sort();
    };

    const handleAdd = () => {
        if (!digit || digit.length < 4) {
            showTooltipMessage('Minimum 4 digits required', 'digit');
            return;
        }

        if (digit.length > 10) {
            showTooltipMessage('Maximum 10 digits allowed', 'digit');
            return;
        }

        if (!points || parseInt(points) < 5) {
            showTooltipMessage('min amount 5', 'points');
            return;
        }

        const combinations = generateDPCombinations(digit);

        if (combinations.length === 0) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Could not generate combinations',
                type: 'error'
            });
            return;
        }

        const newBids = combinations.map((combo, index) => ({
            id: `${Date.now()}_${index}`,
            pana: combo,
            point: parseInt(points),
            type: selectedGameType.toLowerCase(),
            originalDigit: digit
        }));

        setBids([...bids, ...newBids]);
    };

    const handleDeleteBid = (id) => {
        setBids(bids.filter(bid => bid.id !== id));
    };

    const getTotalBids = () => bids.length;
    const getTotalPoints = () => bids.reduce((sum, bid) => sum + bid.point, 0);

    const handleSubmit = () => {
        if (bids.length === 0) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Please add at least one bid',
                type: 'error'
            });
            return;
        }
        setShowConfirmModal(true);
    };

    const [loading, setLoading] = useState(false);

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

            const formattedBids = bids.map(bid => ({
                pana: bid.pana,
                points: bid.point,
                session: selectedGameType
            }));

            const totalAmount = getTotalPoints();

            const response = await placeDPMotorBet(
                userId,
                username,
                formattedBids,
                marketName || gameName,
                String(currentMarketId),
                totalAmount
            );

            if (response && (response.status === true || response.status === 'true' || response.status === 'success')) {
                fetchBalance();
                setBids([]);
                setDigit('');
                setPoints('');

                setAlertConfig({
                    visible: true,
                    title: 'Success',
                    message: `${bids.length} bids placed successfully!`,
                    type: 'success'
                });
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: response?.message || 'Failed to place bids. Please try again.',
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

    const renderBidItem = ({ item }) => (
        <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>{item.pana}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{item.point}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{item.type}</Text>
            <TouchableOpacity
                style={[styles.deleteCell, { flex: 0.8 }]}
                onPress={() => handleDeleteBid(item.id)}
            >
                <View style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={14} color="#fff" />
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <MarqueeText text={`${gameName} - DP MOTOR`} style={styles.headerTitle} />
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

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Enter Digit:</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Number"
                            placeholderTextColor="#999"
                            keyboardType="number-pad"
                            maxLength={10}
                            value={digit}
                            onChangeText={handleDigitChange}
                        />
                        {showTooltip && tooltipTarget === 'digit' && (
                            <View style={styles.tooltip}>
                                <View style={styles.tooltipBubble}>
                                    <Ionicons name="information-circle" size={16} color="#fff" style={styles.tooltipIcon} />
                                    <Text style={styles.tooltipText}>{tooltipMessage}</Text>
                                </View>
                                <View style={styles.tooltipArrow} />
                            </View>
                        )}
                        {showTooltip && tooltipTarget === 'digit' && (
                            <Ionicons name="information-circle" size={18} color="red" style={styles.errorIcon} />
                        )}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Enter Points:</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Point"
                            placeholderTextColor="#999"
                            keyboardType="number-pad"
                            value={points}
                            onChangeText={(text) => setPoints(text.replace(/[^0-9]/g, ''))}
                        />
                        {showTooltip && tooltipTarget === 'points' && (
                            <View style={styles.tooltip}>
                                <View style={styles.tooltipBubble}>
                                    <Ionicons name="information-circle" size={16} color="#fff" style={styles.tooltipIcon} />
                                    <Text style={styles.tooltipText}>{tooltipMessage}</Text>
                                </View>
                                <View style={styles.tooltipArrow} />
                            </View>
                        )}
                        {showTooltip && tooltipTarget === 'points' && (
                            <Ionicons name="information-circle" size={18} color="red" style={styles.errorIcon} />
                        )}
                    </View>
                </View>

                <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>

                {bids.length > 0 && (
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, { flex: 1.2 }]}>Pana</Text>
                        <Text style={[styles.headerCell, { flex: 1 }]}>Point</Text>
                        <Text style={[styles.headerCell, { flex: 1 }]}>Type</Text>
                        <Text style={[styles.headerCell, { flex: 0.8 }]}>Delete</Text>
                    </View>
                )}
            </View>

            <View style={styles.scrollableContent}>
                {bids.length > 0 ? (
                    <FlatList
                        data={bids}
                        renderItem={renderBidItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No bids added yet</Text>
                    </View>
                )}
            </View>

            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 15), height: 75 + insets.bottom }]}>
                <View style={styles.totalSection}>
                    <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>Bids</Text>
                        <Text style={styles.totalValue}>{getTotalBids()}</Text>
                    </View>
                    <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>Points</Text>
                        <Text style={styles.totalValue}>{getTotalPoints()}</Text>
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
                        <Text style={styles.confirmSubtitle}>Total Bids: {getTotalBids()} | Total Points: {getTotalPoints()}</Text>

                        <ScrollView style={styles.confirmList} showsVerticalScrollIndicator={true}>
                            <View style={styles.confirmTableHeader}>
                                <Text style={[styles.confirmHeaderText, { flex: 1.2 }]}>Pana</Text>
                                <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Point</Text>
                                <Text style={[styles.confirmHeaderText, { flex: 1 }]}>Type</Text>
                            </View>
                            {bids.map((bid) => (
                                <View key={bid.id} style={styles.confirmRow}>
                                    <Text style={[styles.confirmCell, { flex: 1.2 }]}>{bid.pana}</Text>
                                    <Text style={[styles.confirmCell, { flex: 1 }]}>{bid.point}</Text>
                                    <Text style={[styles.confirmCell, { flex: 1 }]}>{bid.type}</Text>
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
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        fontFamily: 'Poppins_400Regular',
    },
    topRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    datePickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30, gap: 8 },
    dateText: { fontSize: 14, color: '#000', fontWeight: '500' },
    dropdown: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30 },
    dropdownText: { fontSize: 14, color: '#000', fontWeight: '500' },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 14, color: '#000', fontWeight: '500', marginBottom: 8 },
    inputWrapper: { position: 'relative' },
    textInput: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, fontSize: 15, color: '#000', textAlign: 'center', fontWeight: '500' },
    addButton: { backgroundColor: '#C36578', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 20, marginTop: 4 },
    addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#C36578', marginBottom: 4 },
    headerCell: { fontSize: 14, fontWeight: '600', color: '#C36578', textAlign: 'center' },
    tableRow: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 8, marginBottom: 8, borderRadius: 12, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    tableCell: { fontSize: 14, color: '#000', textAlign: 'center', fontWeight: '500' },
    deleteCell: { alignItems: 'center', justifyContent: 'center' },
    deleteButton: { backgroundColor: '#C36578', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
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
    modalOptionTextSelected: { color: '#2E4A3E' },
    tooltip: { position: 'absolute', top: -45, left: 0, right: 0, alignItems: 'center', zIndex: 100 },
    tooltipBubble: { backgroundColor: '#333', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
    tooltipIcon: { marginTop: 1 },
    tooltipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    tooltipArrow: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#333' },
    errorIcon: { position: 'absolute', right: 12, top: 14 }
});
