import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Modal,
    Dimensions,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dateViseResult } from '../../api/auth';

const SCREEN_WIDTH = Dimensions.get('window').width;

const getTodayDate = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatToDisplayDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const years = ['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export default function GameResults({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [marketResults, setMarketResults] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [refreshing, setRefreshing] = useState(false);

    // Date Picker Modal State (Reused from BidHistory)
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [tempDay, setTempDay] = useState('01');
    const [tempMonth, setTempMonth] = useState('01');
    const [tempYear, setTempYear] = useState('2026');

    useEffect(() => {
        const today = new Date();
        setTempDay(String(today.getDate()).padStart(2, '0'));
        setTempMonth(String(today.getMonth() + 1).padStart(2, '0'));
        setTempYear(String(today.getFullYear()));
        fetchAllResults(getTodayDate());
    }, []);

    const fetchAllResults = async (date) => {
        if (!refreshing) setLoading(true);
        console.log('Fetching results for date:', date);
        try {
            const response = await dateViseResult(date);
            if (response && response.status === 'success' && response.data) {
                const results = response.data.map(item => ({
                    id: item.id || item.market_id,
                    name: item.market_name,
                    value: formatResult(item)
                }));
                setMarketResults(results);
            } else {
                setMarketResults([]);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            setMarketResults([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllResults(selectedDate);
    }, [selectedDate, refreshing]);

    const calculateDigit = (pana) => {
        if (!pana || pana === '***' || pana.length !== 3) return null;
        const sum = pana.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
        return sum % 10;
    };

    const formatResult = (res) => {
        if (!res || typeof res !== 'object') return '***-**-***';

        let open = res.open_number || '***';
        let close = res.close_number || '***';

        // Handle Jodi calculation
        let jodi = res.combined_digit;
        if (!jodi || jodi === '**') {
            const openDigit = calculateDigit(open);
            const closeDigit = calculateDigit(close);

            if (openDigit !== null && closeDigit !== null) {
                jodi = `${openDigit}${closeDigit}`;
            } else if (openDigit !== null) {
                jodi = `${openDigit}*`;
            } else if (closeDigit !== null) {
                jodi = `*${closeDigit}`;
            } else {
                jodi = '**';
            }
        }

        const formatField = (val, placeholder) => {
            if (val === '-' || val === '' || val === null || val === undefined) return placeholder;
            return val;
        };

        const fOpen = formatField(open, '***');
        const fJodi = formatField(jodi, '**');
        const fClose = formatField(close, '***');

        return `${fOpen}-${fJodi}-${fClose}`;
    };

    const openDatePicker = () => {
        const [y, m, d] = selectedDate.split('-');
        setTempYear(y);
        setTempMonth(m);
        setTempDay(d);
        setIsModalVisible(true);
    };

    const confirmDate = () => {
        const formattedDate = `${tempYear}-${tempMonth}-${tempDay}`;

        const selected = new Date(formattedDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // Prevent future dates
        if (selected > today) {
            // Ideally show an alert, or just reset to today, or do nothing.
            // For consistency with other screens, we just don't update if it's future.
            // But since this is a modal "Select" confirmation, user expects feedback.
            // Let's just set it to Today if future.
            alert('Cannot select future date.');
            return;
        }

        setSelectedDate(formattedDate);
        setIsModalVisible(false);
        fetchAllResults(formattedDate);
    };

    const renderResultItem = (item) => (
        <View key={item.id} style={styles.resultCard}>
            <Text style={styles.marketName}>{item.name}</Text>
            <Text style={styles.resultValue}>{item.value}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2e3caff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={26} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>MARKET RESULT HISTORY</Text>
            </View>

            {/* Date Selection Section */}
            <View style={styles.dateSection}>
                <Text style={styles.selectDateLabel}>Select Date</Text>
                <TouchableOpacity style={styles.datePickerButton} onPress={openDatePicker}>
                    <Text style={styles.datePickerText}>{formatToDisplayDate(selectedDate)}</Text>
                </TouchableOpacity>
            </View>

            {/* Content list */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#6B3A3A" />
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6B3A3A"]} />
                        }
                    >
                        {marketResults.map(renderResultItem)}
                    </ScrollView>
                )}
            </View>

            {/* Date Picker Modal */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Date</Text>

                        <View style={styles.pickerRow}>
                            {/* Day Scroll */}
                            <View style={styles.pickerColumnContainer}>
                                <Text style={styles.columnLabel}>Day</Text>
                                <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                                    {days.map(d => (
                                        <TouchableOpacity key={d} onPress={() => setTempDay(d)} style={[styles.pickerItem, tempDay === d && styles.pickerItemActive]}>
                                            <Text style={[styles.pickerItemText, tempDay === d && styles.pickerItemTextActive]}>{d}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Month Scroll */}
                            <View style={styles.pickerColumnContainer}>
                                <Text style={styles.columnLabel}>Month</Text>
                                <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                                    {months.map((m, idx) => {
                                        const val = String(idx + 1).padStart(2, '0');
                                        return (
                                            <TouchableOpacity key={m} onPress={() => setTempMonth(val)} style={[styles.pickerItem, tempMonth === val && styles.pickerItemActive]}>
                                                <Text style={[styles.pickerItemText, tempMonth === val && styles.pickerItemTextActive]}>{m}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>

                            {/* Year Scroll */}
                            <View style={styles.pickerColumnContainer}>
                                <Text style={styles.columnLabel}>Year</Text>
                                <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                                    {years.map(y => (
                                        <TouchableOpacity key={y} onPress={() => setTempYear(y)} style={[styles.pickerItem, tempYear === y && styles.pickerItemActive]}>
                                            <Text style={[styles.pickerItemText, tempYear === y && styles.pickerItemTextActive]}>{y}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirm} onPress={confirmDate}>
                                <Text style={styles.modalConfirmText}>Select</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2e3caff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
    },
    backButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#f2e3caff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        color: '#000',
        fontFamily: 'Roboto_700Bold',
        flex: 1,
        textAlign: 'center',
        marginRight: 45, // To center title against back button
    },
    dateSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 15,
    },
    selectDateLabel: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'Poppins_500Medium',
    },
    datePickerButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        elevation: 2,
    },
    datePickerText: {
        fontSize: 14,
        color: '#000',
        fontFamily: 'Poppins_600SemiBold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 15,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    marketName: {
        fontSize: 15,
        color: '#6B3A3A',
        fontFamily: 'Poppins_600SemiBold',
        flex: 1,
    },
    resultValue: {
        fontSize: 16,
        color: '#000',
        fontFamily: 'Poppins_600SemiBold',
        letterSpacing: 1,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Roboto_700Bold',
        marginBottom: 20,
        color: '#6B3A3A',
    },
    pickerRow: {
        flexDirection: 'row',
        height: 250,
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    pickerColumnContainer: {
        flex: 1,
        marginHorizontal: 5,
    },
    columnLabel: {
        textAlign: 'center',
        fontSize: 12,
        color: '#999',
        marginBottom: 5,
        fontFamily: 'Poppins_400Regular',
    },
    pickerColumn: {
        flex: 1,
        backgroundColor: '#F7F7F7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    pickerItem: {
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    pickerItemActive: {
        backgroundColor: '#6B3A3A',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'Poppins_500Medium',
    },
    pickerItemTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    modalCancel: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        marginRight: 8,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
    },
    modalConfirm: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        marginLeft: 8,
        borderRadius: 12,
        backgroundColor: '#6B3A3A',
    },
    modalCancelText: {
        color: '#666',
        fontFamily: 'Roboto_700Bold',
    },
    modalConfirmText: {
        color: '#fff',
        fontFamily: 'Roboto_700Bold',
    }
});
