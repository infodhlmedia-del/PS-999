import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    StatusBar,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
    Dimensions,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { result as getRegularResult } from '../../../api/auth';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PanelChartScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { marketId, marketName } = route.params || {};

    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Column widths
    const DATE_WIDTH = 80;
    const REMAINING_WIDTH = SCREEN_WIDTH - DATE_WIDTH;
    const PANNA_WIDTH = REMAINING_WIDTH * 0.4;
    const JODI_WIDTH = REMAINING_WIDTH * 0.2;

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;

        const parts = dateStr.split('-');
        if (parts.length === 3) {
            if (parts[0].length === 4) { // YYYY-MM-DD
                d = new Date(parts[0], parts[1] - 1, parts[2]);
            } else if (parts[2].length === 4) { // DD-MM-YYYY
                d = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }
        return !isNaN(d.getTime()) ? d : null;
    };

    const fetchChartData = async () => {
        setLoading(true);
        try {
            const res = await getRegularResult(marketId);
            // Robust data extraction: check res.data first, then res if it's an array
            const dataArr = res?.data || (Array.isArray(res) ? res : []);

            if (dataArr && dataArr.length > 0) {
                // Filter and sort by date descending
                const filtered = dataArr.filter(item => parseDate(item.result_date || item.date) !== null);
                const sorted = [...filtered].sort((a, b) => {
                    const da = parseDate(a.result_date || a.date);
                    const db = parseDate(b.result_date || b.date);
                    return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
                });
                setChartData(sorted);
            }
        } catch (error) {
            console.error('Error fetching Panel chart:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatDate = (dateStr) => {
        const d = parseDate(dateStr);
        if (!d) return dateStr || "";
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const checkIsRed = (jodi) => {
        if (!jodi || jodi === '**' || jodi.length !== 2) return false;
        const d1 = parseInt(jodi[0]);
        const d2 = parseInt(jodi[1]);
        if (isNaN(d1) || isNaN(d2)) return false;
        return d1 === d2 || Math.abs(d1 - d2) === 5;
    };

    useEffect(() => {
        fetchChartData();
    }, [marketId]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchChartData();
    }, [marketId]);

    const renderHeader = () => (
        <View style={styles.tableHeader}>
            <View style={[styles.headerCell, { width: DATE_WIDTH }]}>
                <Text style={styles.headerText}>Date</Text>
            </View>
            <View style={[styles.headerCell, { width: PANNA_WIDTH }]}>
                <Text style={styles.headerText}>Open Panna</Text>
            </View>
            <View style={[styles.headerCell, { width: JODI_WIDTH }]}>
                <Text style={styles.headerText}>Jodi</Text>
            </View>
            <View style={[styles.headerCell, { width: PANNA_WIDTH }]}>
                <Text style={styles.headerText}>Close Panna</Text>
            </View>
        </View>
    );

    const renderRow = (item) => {
        // Robust extraction with various keys
        const openPanna = item.open_number || (item.full_result && item.full_result.open) || '***';
        const jodi = item.combined_digit || item.jodi || item.last_digit || '**';
        const closePanna = item.close_number || (item.full_result && item.full_result.close) || '***';
        const isRed = checkIsRed(jodi);

        return (
            <View key={item.id || item.result_date || item.date} style={styles.tableRow}>
                <View style={[styles.dateCell, { width: DATE_WIDTH }]}>
                    <Text style={styles.dateText}>{formatDate(item.result_date || item.date)}</Text>
                </View>
                <View style={[styles.pannaCell, { width: PANNA_WIDTH }]}>
                    <Text style={styles.pannaText}>{openPanna}</Text>
                </View>
                <View style={[styles.jodiCell, { width: JODI_WIDTH }]}>
                    <Text style={[styles.jodiText, isRed && jodi !== '**' && styles.redText]}>
                        {jodi}
                    </Text>
                </View>
                <View style={[styles.pannaCell, { width: PANNA_WIDTH }]}>
                    <Text style={styles.pannaText}>{closePanna}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{marketName} PANEL CHART</Text>
            </View>

            <View style={styles.tableWrapper}>
                {renderHeader()}

                {loading && !refreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#4B0076" />
                    </View>
                ) : (
                    <ScrollView
                        style={styles.verticalScroll}
                        showsVerticalScrollIndicator={false}
                        overScrollMode="never"
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D32F2F"]} progressBackgroundColor="#ffffff" tintColor="#D32F2F" />
                        }
                    >
                        {chartData.map(item => renderRow(item))}
                        <View style={{ height: 50 }} />
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5EDE0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? 45 : 10,
        paddingBottom: 15,
        backgroundColor: '#F5EDE0',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginLeft: 15,
        flex: 1,
    },
    tableWrapper: {
        flex: 1,
        backgroundColor: '#fff',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#4E0E32',
    },
    headerCell: {
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.2,
        borderRightColor: '#fff',
    },
    headerText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    dateCell: {
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    dateText: {
        fontSize: 10,
        color: '#333',
        fontWeight: 'bold',
    },
    pannaCell: {
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.2,
        borderRightColor: '#eee',
    },
    jodiCell: {
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.2,
        borderRightColor: '#eee',
        backgroundColor: '#fff8f8',
    },
    pannaText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    jodiText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    redText: {
        color: '#D32F2F',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verticalScroll: {
        flex: 1,
    }
});

export default PanelChartScreen;
