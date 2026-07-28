import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, StatusBar, Dimensions, Modal, FlatList, Animated, Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../../components/CustomAlert';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { getWalletBalance, getMarkets, JodiGame as PlaceJodiBet } from '../../../api/auth';


const SCREEN_WIDTH = Dimensions.get('window').width;

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

const JodiGame = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { gameName, gameId, isOpenAvailable = true, isCloseAvailable = true } = route.params || {};


    const [mode, setMode] = useState('EASY'); // 'EASY' or 'SPECIAL'
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [marketId, setMarketId] = useState(gameId || null);

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
        onClose: null
    });


    // Easy Mode State
    const [easyJodi, setEasyJodi] = useState('');
    const [easyPoints, setEasyPoints] = useState('');
    const [easyBids, setEasyBids] = useState([]);

    // Special Mode State
    // We'll store special mode inputs in an object { '00': '10', '05': '50' }
    const [specialBids, setSpecialBids] = useState({});

    useEffect(() => {
        // Strict check for open availability with delay to ensure mount
        if (!isOpenAvailable || isOpenAvailable === 'false') {
            const timer = setTimeout(() => {
                setAlertConfig({
                    visible: true,
                    title: 'Market Closed',
                    message: 'Jodi game is only available when market is OPEN.',
                    type: 'warning',
                    onClose: () => navigation.goBack()
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpenAvailable]);

    useEffect(() => {
        const d = new Date();
        const formatted = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        setCurrentDate(formatted);
    }, []);

    const fetchWalletBalance = async () => {
        try {
            const mobile = await AsyncStorage.getItem('userMobile');
            const userId = await AsyncStorage.getItem('userId');
            if (mobile && userId) {
                const data = await getWalletBalance(mobile, userId);
                if (data && (data.status === true || data.status === 'true')) {
                    setBalance(parseFloat(data.balance));
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
                    console.log('Jodi Game: Market ID found:', currentMarket.id);
                } else {
                    console.warn('Jodi Game: Market not found for gameName:', gameName);
                }
            }
        } catch (error) {
            console.error('Jodi Game: Error fetching markets:', error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchWalletBalance();
            if (!marketId) fetchMarketId();
        }, [])
    );

    // --- Handlers for Easy Mode ---
    const handleAddEasyBid = () => {
        if (!easyJodi || easyJodi.length !== 2) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Please enter a valid 2-digit Jodi',
                type: 'error'
            });
            return;
        }

        if (!easyPoints || parseInt(easyPoints) <= 0) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Please enter valid points',
                type: 'error'
            });
            return;
        }

        const newBid = {
            id: Date.now().toString() + Math.random().toString(),
            jodi: easyJodi,
            points: easyPoints
        };
        setEasyBids([...easyBids, newBid]);
        setEasyJodi('');
        setEasyPoints('');
    };

    const handleDeleteEasyBid = (id) => {
        setEasyBids(easyBids.filter(b => b.id !== id));
    };

    // --- Handlers for Special Mode ---
    const handleSpecialPointChange = (jodi, value) => {
        setSpecialBids(prev => {
            const newBids = { ...prev };
            if (!value) {
                delete newBids[jodi];
            } else {
                newBids[jodi] = value;
            }
            return newBids;
        });
    };

    // --- Calculation ---
    const calculateTotalBids = () => {
        if (mode === 'EASY') return easyBids.length;
        return Object.keys(specialBids).length;
    };

    const calculateTotalPoints = () => {
        if (mode === 'EASY') {
            return easyBids.reduce((sum, bid) => sum + parseInt(bid.points), 0);
        }
        return Object.values(specialBids).reduce((sum, p) => sum + (parseInt(p) || 0), 0);
    };

    // --- Submission ---
    const handleSubmit = () => {
        const totalPoints = calculateTotalPoints();
        const totalCount = calculateTotalBids();

        if (totalCount === 0) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Please add at least one bid',
                type: 'error'
            });
            return;
        }

        if (totalPoints > balance) {
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Insufficient balance',
                type: 'error'
            });
            return;
        }

        setShowConfirmModal(true);
    };

    const handleFinalSubmit = async () => {
        setSubmitting(true);
        setShowConfirmModal(false);
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
                setSubmitting(false);
                return;
            }


            let bidsPayload = [];

            if (mode === 'EASY') {
                bidsPayload = easyBids;
            } else {
                // Special Mode
                bidsPayload = Object.keys(specialBids).map(jodi => ({
                    jodi: jodi,
                    points: specialBids[jodi]
                }));
            }

            const numbers = bidsPayload.map(b => b.jodi || b.digit); // b.jodi from easy, b.digit fallback
            const amounts = bidsPayload.map(b => parseInt(b.points));

            // console.log('Submitting Jodi Bid:', { userId, username, numbers, amounts, gameName, marketId });

            const response = await PlaceJodiBet(userId, username, numbers, amounts, gameName, String(marketId));

            const isSuccess = response && (
                response.status === 'success' ||
                response.status === true ||
                response.status === 'true' ||
                (typeof response.message === 'string' && response.message.toLowerCase().includes('success'))
            );

            if (isSuccess) {
                setAlertConfig({
                    visible: true,
                    title: 'Success',
                    message: 'Bids placed successfully!',
                    type: 'success',
                    onClose: () => {
                        setEasyBids([]);
                        setSpecialBids({});
                        setEasyJodi('');
                        setEasyPoints('');
                        fetchWalletBalance();
                    }
                });
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: response?.message || 'Failed to place bids',
                    type: 'error'
                });
            }

        } catch (error) {
            console.error('Jodi Bid Error:', error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Network request failed',
                type: 'error'
            });
        } finally {

            setSubmitting(false);
        }
    };


    // --- Render Helpers ---
    const renderSpecialGrid = () => {
        // 00 to 99
        const gridItems = [];
        for (let i = 0; i < 100; i++) {
            const jodi = i.toString().padStart(2, '0');
            gridItems.push(jodi);
        }

        return (
            <View style={styles.gridContainer}>
                {gridItems.map((jodi) => (
                    <View key={jodi} style={styles.gridItem}>
                        <View style={styles.gridHeader}>
                            <Text style={styles.gridHeaderText}>{jodi}</Text>
                        </View>
                        <TextInput
                            style={styles.gridInput}
                            keyboardType="number-pad"
                            placeholder=""
                            value={specialBids[jodi] || ''}
                            onChangeText={(val) => handleSpecialPointChange(jodi, val.replace(/[^0-9]/g, ''))}
                        />
                    </View>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <MarqueeText text={`${gameName || 'SRIDEVI NIGHT'} - JODI`} style={styles.headerTitle} />
                <View style={styles.balanceChip}>
                    <Ionicons name="wallet" size={16} color="#fff" />
                    <Text style={styles.balanceText}>{balance.toFixed(1)}</Text>
                </View>
            </View>

            {/* Mode Selector */}
            <View style={styles.staticContent}>
                <View style={styles.modeContainer}>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'EASY' && styles.modeButtonSelected]}
                        onPress={() => setMode('EASY')}
                    >
                        <Text style={[styles.modeButtonText, mode === 'EASY' && styles.modeButtonTextSelected]}>EASY MODE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeButton, mode === 'SPECIAL' && styles.modeButtonSelected]}
                        onPress={() => setMode('SPECIAL')}
                    >
                        <Text style={[styles.modeButtonText, mode === 'SPECIAL' && styles.modeButtonTextSelected]}>SPECIAL MODE</Text>
                    </TouchableOpacity>
                </View>

                {mode === 'EASY' ? (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Enter Jodi Digit:</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder=""
                                keyboardType="number-pad"
                                maxLength={2}
                                value={easyJodi}
                                onChangeText={(text) => setEasyJodi(text.replace(/[^0-9]/g, ''))}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Enter Points:</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Point"
                                placeholderTextColor="#aaa"
                                keyboardType="number-pad"
                                value={easyPoints}
                                onChangeText={(text) => setEasyPoints(text.replace(/[^0-9]/g, ''))}
                            />
                        </View>

                        <TouchableOpacity style={styles.addButton} onPress={handleAddEasyBid}>
                            <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>

                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderText}>Jodi</Text>
                            <Text style={styles.tableHeaderText}>Point</Text>
                            <Text style={styles.tableHeaderText}>Delete</Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.inputGroup}>
                        <View style={styles.dateBadge}>
                            <Ionicons name="calendar-outline" size={18} color="#C36578" />
                            <Text style={styles.dateText}>{currentDate}</Text>
                        </View>
                    </View>
                )}
            </View>

            <ScrollView 
                style={styles.scrollableContent} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {mode === 'EASY' ? (
                    <>
                        {/* List */}
                        {easyBids.map((bid) => (
                            <View key={bid.id} style={styles.tableRow}>
                                <Text style={styles.tableCell}>{bid.jodi}</Text>
                                <Text style={styles.tableCell}>{bid.points}</Text>
                                <TouchableOpacity style={styles.tableCell} onPress={() => handleDeleteEasyBid(bid.id)}>
                                    <Ionicons name="trash-outline" size={20} color="#C36578" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </>
                ) : (
                    <>
                        {/* SPECIAL MODE GRID */}
                        {renderSpecialGrid()}
                    </>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 15), height: 75 + insets.bottom }]}>
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Bids</Text>
                        <Text style={styles.summaryValue}>{calculateTotalBids()}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Points</Text>
                        <Text style={styles.summaryValue}>{calculateTotalPoints()}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
            </View>

            {/* Confirmation Modal */}
            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Confirm Bids</Text>
                        <View style={styles.modalListHeader}>
                            <Text style={[styles.modalListHeaderText, { flex: 1 }]}>Jodi</Text>
                            <Text style={[styles.modalListHeaderText, { flex: 1 }]}>Points</Text>
                        </View>

                        <ScrollView style={styles.modalList}>
                            {mode === 'EASY' ? (
                                easyBids.map((bid) => (
                                    <View key={bid.id} style={styles.modalListItem}>
                                        <Text style={[styles.modalListItemText, { flex: 1 }]}>{bid.jodi}</Text>
                                        <Text style={[styles.modalListItemText, { flex: 1 }]}>{bid.points}</Text>
                                    </View>
                                ))
                            ) : (
                                Object.keys(specialBids).map((jodi) => (
                                    <View key={jodi} style={styles.modalListItem}>
                                        <Text style={[styles.modalListItemText, { flex: 1 }]}>{jodi}</Text>
                                        <Text style={[styles.modalListItemText, { flex: 1 }]}>{specialBids[jodi]}</Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        <View style={styles.modalSummary}>
                            <Text style={styles.modalSummaryText}>Total Bids: {calculateTotalBids()}</Text>
                            <Text style={styles.modalSummaryText}>Total Points: {calculateTotalPoints()}</Text>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowConfirmModal(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton, submitting && styles.disabledButton]}
                                onPress={handleFinalSubmit}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalButtonText}>Final Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5EDE0',
    },
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
    modeContainer: {
        flexDirection: 'row',
        marginHorizontal: 15,
        marginBottom: 10,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#C36578'
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    modeButtonSelected: {
        backgroundColor: '#C36578'
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'Poppins_600SemiBold'
    },
    modeButtonTextSelected: {
        color: '#fff'
    },
    staticContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    scrollableContent: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 150,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        flex: 1,
        fontFamily: 'Poppins_600SemiBold'
    },
    dropdownButton: {
        flex: 1.5,
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 15,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'Poppins_600SemiBold'
    },
    dropdownList: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginTop: -10,
        marginBottom: 15,
        marginLeft: '40%',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 }
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee'
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'Poppins_600SemiBold'
    },
    selectedDropdownText: {
        color: '#C36578',
        fontWeight: 'bold'
    },
    textInput: {
        flex: 1.5,
        backgroundColor: '#fff',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        fontFamily: 'Poppins_600SemiBold'
    },
    addButton: {
        backgroundColor: '#C36578',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins_600SemiBold'
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#C36578',
        paddingBottom: 10,
        marginBottom: 10
    },
    tableHeaderText: {
        flex: 1,
        textAlign: 'center',
        color: '#C36578',
        fontWeight: 'bold',
        fontFamily: 'Poppins_600SemiBold'
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
        color: '#333',
        fontFamily: 'Poppins_600SemiBold',
        alignItems: 'center'
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
        fontFamily: 'Poppins_600SemiBold'
    },
    // Special Mode Styles
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        gap: 8
    },
    dateText: {
        fontSize: 14,
        color: '#333',
        fontWeight: 'bold'
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10
    },
    gridItem: {
        width: '47%',
        flexDirection: 'row',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    gridHeader: {
        width: 50,
        backgroundColor: '#C36578',
        justifyContent: 'center',
        alignItems: 'center'
    },
    gridHeaderText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    gridInput: {
        flex: 1,
        backgroundColor: '#D3DCE6', // Light grayish blue from screenshot
        textAlign: 'center',
        fontSize: 16,
        color: '#333',
        paddingVertical: 10
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#EBDCCB',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#DCC3B0',
        justifyContent: 'space-between'
    },
    summaryContainer: {
        flexDirection: 'row',
        gap: 30
    },
    summaryItem: {
        alignItems: 'center'
    },
    summaryLabel: {
        fontSize: 12,
        color: '#555',
        fontFamily: 'Poppins_600SemiBold'
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        fontFamily: 'Poppins_600SemiBold'
    },
    submitButton: {
        backgroundColor: '#C36578',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 10,
        elevation: 2
    },
    disabledButton: {
        opacity: 0.7
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins_600SemiBold'
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        maxHeight: '80%'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#C36578',
        textAlign: 'center',
        marginBottom: 15,
        fontFamily: 'Poppins_600SemiBold'
    },
    modalListHeader: {
        flexDirection: 'row',
        backgroundColor: '#F5EDE0',
        padding: 10,
        borderRadius: 8,
        marginBottom: 5
    },
    modalListHeaderText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
        fontFamily: 'Poppins_600SemiBold'
    },
    modalList: {
        maxHeight: 200
    },
    modalListItem: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    modalListItemText: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        fontFamily: 'Poppins_600SemiBold'
    },
    modalSummary: {
        marginTop: 15,
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10
    },
    modalSummaryText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        fontFamily: 'Poppins_600SemiBold'
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 15
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: '#999'
    },
    confirmButton: {
        backgroundColor: '#C36578'
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold'
    }
});

export default JodiGame;
