import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    Image,
    Modal,
    RefreshControl
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bidhistory } from '../../api/auth';
import CustomAlert from '../../components/CustomAlert';


const SCREEN_WIDTH = Dimensions.get('window').width;

const getTodayDate = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const years = ['2024', '2025', '2026'];

export default function BidHistoryScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [allBids, setAllBids] = useState([]);
    const [paginatedBids, setPaginatedBids] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [fromDate, setFromDate] = useState(getTodayDate());
    const [toDate, setToDate] = useState(getTodayDate());
    const itemsPerPage = 10;

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
    });


    // Date Picker Modal State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [pickingFor, setPickingFor] = useState('from'); // 'from' or 'to'
    const [tempDay, setTempDay] = useState('01');
    const [tempMonth, setTempMonth] = useState('01');
    const [tempYear, setTempYear] = useState('2026');

    useEffect(() => {
        const today = new Date();
        setTempDay(String(today.getDate()).padStart(2, '0'));
        setTempMonth(String(today.getMonth() + 1).padStart(2, '0'));
        setTempYear(String(today.getFullYear()));
        fetchBids();
    }, []);

    useEffect(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedBids(allBids.slice(startIndex, endIndex));
    }, [allBids, currentPage]);

    const fetchBids = async () => {
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: 'User ID not found',
                    type: 'error'
                });
                return;
            }


            const response = await bidhistory(userId, fromDate, toDate);
            if (response && (response.status === true || response.status === 'true')) {
                // Filter by user ID on client side since API returns all users' data
                const filteredBids = (response.data || []).filter(item => String(item.user_id) === String(userId));
                setAllBids(filteredBids);
                setTotalCount(filteredBids.length);
                setCurrentPage(1);
            } else {
                setAllBids([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error('Error fetching bids:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchBids();
        setRefreshing(false);
    }, [fromDate, toDate]);

    const openDatePicker = (type) => {
        setPickingFor(type);
        const currentDate = type === 'from' ? fromDate : toDate;
        const [y, m, d] = currentDate.split('-');
        setTempYear(y);
        setTempMonth(m);
        setTempDay(d);
        setIsModalVisible(true);
    };

    const confirmDate = async () => {
        const formattedDate = `${tempYear}-${tempMonth}-${tempDay}`;
        if (pickingFor === 'from') {
            setFromDate(formattedDate);
        } else {
            setToDate(formattedDate);
        }
        setIsModalVisible(false);

        // Auto fetch triggered after state is set locally in next frame or just manually here
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem('userId');
            const response = await bidhistory(userId, pickingFor === 'from' ? formattedDate : fromDate, pickingFor === 'to' ? formattedDate : toDate);
            if (response && (response.status === true || response.status === 'true')) {
                // Filter by user ID on client side since API returns all users' data
                const filteredBids = (response.data || []).filter(item => String(item.user_id) === String(userId));
                setAllBids(filteredBids);
                setTotalCount(filteredBids.length);
                setCurrentPage(1);
            } else {
                setAllBids([]);
                setTotalCount(0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentPage * itemsPerPage < allBids.length) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const renderBidItem = (item) => (
        <View key={item.id} style={styles.bidCard}>
            <View style={styles.bidHeader}>
                <View>
                    <Text style={styles.gameName}>{item.game_name}</Text>
                    <Text style={styles.marketRole}>{item.bet_market_role}</Text>
                </View>
                <View style={styles.headerRightInfo}>
                    <Text style={styles.bidPoints}>{item.points} pts</Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.add_win === "1" ? '#4CAF50' : item.win_result ? '#F44336' : '#FFC107' }]}>
                        <Text style={styles.statusText}>
                            {item.add_win === "1" ? 'WON' : item.win_result ? 'LOST' : 'PENDING'}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.bidDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pana</Text>
                    <Text style={styles.detailValue}>{item.pana_name}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Number</Text>
                    <Text style={styles.detailValue}>{item.bid_number}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Session</Text>
                    <Text style={styles.detailValue}>{item.session}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>{item.time12hr}</Text>
                </View>
            </View>

            {item.add_win === "1" && (
                <View style={styles.winRow}>
                    <Ionicons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.winText}>Won: ₹{item.win_amt}</Text>
                </View>
            )}

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
                <Text style={styles.headerTitle}>Bid History</Text>
                <TouchableOpacity style={styles.headerRight} onPress={fetchBids}>
                    <Text style={styles.filterText}>Search</Text>
                    <Ionicons name="search" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Date Selection Row */}
            <View style={styles.dateRow}>
                <View style={styles.dateColumn}>
                    <Text style={styles.dateLabel}>From Date</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('from')}>
                        <Text style={styles.dateButtonText}>{fromDate}</Text>
                        <Ionicons name="calendar-outline" size={16} color="#6B3A3A" />
                    </TouchableOpacity>
                </View>
                <View style={styles.dateColumn}>
                    <Text style={styles.dateLabel}>To Date</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('to')}>
                        <Text style={styles.dateButtonText}>{toDate}</Text>
                        <Ionicons name="calendar-outline" size={16} color="#6B3A3A" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.centerMode}>
                        <ActivityIndicator size="large" color="#6B3A3A" />
                    </View>
                ) : paginatedBids.length === 0 ? (
                    <View style={styles.centerMode}>
                        <MaterialCommunityIcons name="folder-outline" size={100} color="#6B3A3A" />
                        <Text style={styles.emptyText}>NO BID FOUND</Text>
                    </View>
                ) : (
                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6B3A3A']} />
                        }
                    >
                        {paginatedBids.map(renderBidItem)}
                    </ScrollView>
                )}
            </View>

            {/* Pagination Footer */}
            <View style={styles.paginationFooter}>
                <TouchableOpacity
                    style={[styles.pageButton, currentPage === 1 && { opacity: 0.5 }]}
                    onPress={handlePrev}
                    disabled={currentPage === 1}
                >
                    <Ionicons name="chevron-back" size={20} color="#000" />
                    <Text style={styles.pageButtonText}>PREV</Text>
                </TouchableOpacity>

                <View style={styles.pageNumberCircle}>
                    <Text style={styles.pageNumberText}>{currentPage}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.pageButton, (currentPage * itemsPerPage >= allBids.length) && { opacity: 0.5 }]}
                    onPress={handleNext}
                    disabled={currentPage * itemsPerPage >= allBids.length}
                >
                    <Text style={styles.pageButtonText}>NEXT</Text>
                    <Ionicons name="chevron-forward" size={20} color="#000" />
                </TouchableOpacity>
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
                        <Text style={styles.modalTitle}>Select {pickingFor === 'from' ? 'From' : 'To'} Date</Text>

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

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
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
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 10,
        justifyContent: 'space-between',
    },
    backButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#f2e3caff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    headerTitle: {
        fontSize: 24,
        color: '#000',
        fontFamily: 'Roboto_700Bold',
        flex: 1,
        marginLeft: 15,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        elevation: 2,
    },
    filterText: {
        fontSize: 14,
        marginRight: 5,
        color: '#000',
        fontFamily: 'Poppins_600SemiBold',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginVertical: 10,
    },
    dateColumn: {
        flex: 0.48,
    },
    dateLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        fontFamily: 'Poppins_400Regular',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dateButtonText: {
        fontSize: 14,
        color: '#000',
        fontFamily: 'Poppins_500Medium',
    },
    content: {
        flex: 1,
        paddingHorizontal: 15,
    },
    centerMode: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#333',
        marginTop: 15,
        fontFamily: 'Poppins_400Regular',
        letterSpacing: 1,
    },
    bidCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bidHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 8,
        marginBottom: 8,
    },
    gameName: {
        fontSize: 16,
        fontFamily: 'Roboto_700Bold',
        color: '#6B3A3A',
    },
    bidPoints: {
        fontSize: 18,
        fontFamily: 'Roboto_700Bold',
        color: '#2196F3',
    },
    marketRole: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Poppins_400Regular',
    },
    headerRightInfo: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'Roboto_700Bold',
    },
    bidDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailRow: {
        alignItems: 'flex-start',
    },
    detailLabel: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Poppins_400Regular',
    },
    detailValue: {
        fontSize: 13,
        color: '#000',
        fontFamily: 'Poppins_600SemiBold',
    },
    winRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        padding: 8,
        borderRadius: 6,
        marginTop: 10,
    },
    winText: {
        marginLeft: 5,
        fontSize: 14,
        color: '#2e7d32',
        fontFamily: 'Roboto_700Bold',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    dateText: {
        fontSize: 11,
        color: '#999',
        fontFamily: 'Poppins_400Regular',
    },
    barcodeText: {
        fontSize: 11,
        color: '#999',
        fontFamily: 'Poppins_400Regular',
    },
    paginationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    pageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    pageButtonText: {
        fontSize: 15,
        fontFamily: 'Roboto_700Bold',
        marginHorizontal: 5,
    },
    pageNumberCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageNumberText: {
        color: '#FFC107',
        fontSize: 16,
        fontFamily: 'Roboto_700Bold',
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
