import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserQrAddPointsRequests, paymentStatus } from '../../api/auth';
import CustomAlert from '../../components/CustomAlert';


export default function AddFundHistoryScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyTab, setHistoryTab] = useState('accepted'); // 'accepted', 'approve', or 'processing'

    // Custom Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'success',
    });


    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
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


            const response = await UserQrAddPointsRequests(userId);
            if (response && (response.status === true || response.status === 'true')) {
                const mappedHistory = (response.data || []).map(item => ({
                    ...item,
                    amount: item.request_amount,
                    status: item.request_accecept_status === "1" ? "success" : "processing",
                    created_at: `${item.request_date} ${item.request_time}`,
                    mobile: item.username // Use username from new API
                }));
                setHistory(mappedHistory);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (orderId, amount) => {
        setLoading(true);
        try {
            const response = await paymentStatus(orderId);
            const isSuccess = response && (
                (response.status === true && response.data?.status === 'success') ||
                response.status === 'SUCCESS' ||
                response.data?.status === 'COMPLETED'
            );

            if (isSuccess) {
                setAlertConfig({
                    visible: true,
                    title: 'Verification Done',
                    message: response.data?.message || `Payment of ₹${amount} verified successfully.`,
                    type: 'success',
                });
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Not Verified',
                    message: response.data?.message || 'Payment is still pending or not found.',
                    type: 'warning',
                });
            }
            await fetchHistory();
        } catch (error) {
            console.error('Manual Verify Error:', error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Failed to verify payment. Please try again later.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchHistory();
        setRefreshing(false);
    }, []);

    const renderHistoryItem = (item) => (
        <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.amount}>₹ {item.amount}</Text>
                <View style={{ alignItems: 'flex-end', gap: 5 }}>
                    <View style={[
                        styles.statusPill,
                        { backgroundColor: item.status === 'success' ? '#E8F5E9' : '#FFF3E0' }
                    ]}>
                        <Text style={[
                            styles.statusText,
                            { color: item.status === 'success' ? '#2E7D32' : '#EF6C00' }
                        ]}>
                            {item.status === 'success' ? 'Accepted' : 'Processing'}
                        </Text>
                    </View>

                    {historyTab === 'approve' && (
                        <TouchableOpacity
                            style={styles.inlineRefreshBtn}
                            onPress={() => handleVerify(item.order_id, item.amount)}
                        >
                            <Ionicons name="refresh-circle" size={24} color="#6B3A3A" />
                            <Text style={styles.inlineRefreshText}>Refresh</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.detailText}>{item.created_at}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.username}>User: {item.mobile}</Text>
            </View>
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
                <Text style={styles.headerTitle}>Add Fund History</Text>
                <TouchableOpacity onPress={fetchHistory} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* History Tabs */}
            <View style={styles.historyTabsContainer}>
                <View style={styles.historyTabs}>
                    <TouchableOpacity
                        style={[styles.historyTab, historyTab === 'accepted' && styles.historyTabActive]}
                        onPress={() => setHistoryTab('accepted')}
                    >
                        <Text style={[styles.historyTabText, historyTab === 'accepted' && styles.historyTabTextActive]}>Accepted</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.historyTab, historyTab === 'approve' && styles.historyTabActive]}
                        onPress={() => setHistoryTab('approve')}
                    >
                        <Text style={[styles.historyTabText, historyTab === 'approve' && styles.historyTabTextActive]}>Processing</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.centerMode}>
                        <ActivityIndicator size="large" color="#6B3A3A" />
                    </View>
                ) : history.filter(item => {
                    if (historyTab === 'accepted') return item.status === 'success';
                    if (historyTab === 'approve') return item.status === 'processing';
                    return false;
                }).length === 0 ? (
                    <View style={styles.centerMode}>
                        <MaterialCommunityIcons
                            name={historyTab === 'accepted' ? "check-circle-outline" : "clock-outline"}
                            size={100}
                            color="#6B3A3A"
                        />
                        <Text style={styles.emptyText}>NO {historyTab.toUpperCase()} DATA FOUND</Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 30 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6B3A3A']} />
                        }
                    >
                        {history
                            .filter(item => {
                                if (historyTab === 'accepted') return item.status === 'success';
                                if (historyTab === 'approve') return item.status === 'processing';
                                return false;
                            })
                            .map(renderHistoryItem)}
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
        paddingBottom: 20,
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
        fontSize: 22,
        color: '#000',
        fontFamily: 'Roboto_700Bold',
        flex: 1,
        marginLeft: 15,
    },
    refreshButton: {
        padding: 10,
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
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    amount: {
        fontSize: 20,
        fontFamily: 'Roboto_700Bold',
        color: '#6B3A3A',
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'Poppins_600SemiBold',
        fontWeight: 'bold',
    },
    details: {
        flexDirection: 'row',
        marginBottom: 10,
        gap: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    detailText: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'Poppins_400Regular',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    requestId: {
        fontSize: 11,
        color: '#999',
        fontFamily: 'Poppins_400Regular',
    },
    username: {
        fontSize: 11,
        color: '#999',
        fontFamily: 'Poppins_400Regular',
    },
    historyTabsContainer: {
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    historyTabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#ccc',
        elevation: 2,
    },
    historyTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    historyTabActive: {
        backgroundColor: '#6B3A3A',
    },
    historyTabText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Poppins_600SemiBold',
    },
    historyTabTextActive: {
        color: '#fff',
    },
    inlineRefreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#6B3A3A',
        marginTop: 2,
    },
    inlineRefreshText: {
        fontSize: 11,
        color: '#6B3A3A',
        fontFamily: 'Poppins_600SemiBold',
        marginLeft: 3,
    }
});
