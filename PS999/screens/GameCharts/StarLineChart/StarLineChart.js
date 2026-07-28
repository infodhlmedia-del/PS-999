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
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { starlinegetMarkets, getStarlineResults } from '../../../api/auth';

const SCREEN_WIDTH = Dimensions.get('window').width;

const StarlineChart = () => {
    const navigation = useNavigation();
    const [markets, setMarkets] = useState([]);
    const [chartData, setChartData] = useState([]); // Array of { date, times: { [marketId]: { digit, panna } } }
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Dynamic widths to fit screen
    const numColumns = markets.length > 0 ? markets.length + 1 : 13;
    const CELL_WIDTH = SCREEN_WIDTH / numColumns;
    const DATE_COLUMN_WIDTH = CELL_WIDTH;
    const COLUMN_WIDTH = CELL_WIDTH;

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

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Markets to get columns
            const marketsRes = await starlinegetMarkets();
            if (!marketsRes || marketsRes.status !== true || !marketsRes.data) {
                setLoading(false);
                return;
            }

            const sortedMarkets = marketsRes.data.sort((a, b) => {
                return a.id - b.id;
            });
            setMarkets(sortedMarkets);

            // 2. Fetch results for ALL markets
            const dateMap = {};

            const resultsPromises = sortedMarkets.map(async (market) => {
                try {
                    const res = await getStarlineResults(market.id);
                    if (res && (res.status === 'success' || res.status === true) && res.data) {
                        res.data.forEach(item => {
                            const fullDate = item.result_date || item.date;
                            if (fullDate) {
                                if (!dateMap[fullDate]) {
                                    dateMap[fullDate] = {};
                                }
                                dateMap[fullDate][market.id] = {
                                    digit: item.last_digit_open || '*',
                                    panna: item.open_number || '***',
                                    isRed: checkIsRed(item.last_digit_open, item.open_number)
                                };
                            }
                        });
                    }
                } catch (e) {
                    console.error(`Error fetching results for market ${market.id}:`, e);
                }
            });

            await Promise.all(resultsPromises);

            // 3. Convert dateMap to sorted array
            const formattedData = Object.keys(dateMap).map(date => {
                return {
                    date: formatDate(date),
                    rawDate: date,
                    times: dateMap[date]
                };
            }).sort((a, b) => {
                const da = parseDate(a.rawDate);
                const db = parseDate(b.rawDate);
                return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
            });

            setChartData(formattedData);

        } catch (error) {
            console.error('Error fetching starline chart:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const checkIsRed = (digit, panna) => {
        if (!panna || panna === '***') return false;
        // Triple Panna check (e.g. 111, 222, 000)
        if (panna.length === 3 && panna[0] === panna[1] && panna[1] === panna[2]) {
            return true;
        }
        // Often 0 and 5 single digits are red
        return digit === '0' || digit === '5';
    };

    const formatDate = (dateStr) => {
        const d = parseDate(dateStr);
        if (!d) return dateStr || "";
        let day = '' + d.getDate();
        let month = '' + (d.getMonth() + 1);
        const year = d.getFullYear();

        if (day.length < 2) day = '0' + day;
        if (month.length < 2) month = '0' + month;

        // Wrap date for small columns
        return `${day}-${month}\n${year}`;
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    const renderHeader = () => (
        <View style={styles.tableHeaderGroup}>
            <View style={[styles.headerCell, { width: DATE_COLUMN_WIDTH }]}>
                <Text style={styles.headerText}>Date</Text>
            </View>
            {markets.map(market => {
                const timeParts = market.end_time_12?.split(' ') || [];
                return (
                    <View key={market.id} style={[styles.headerCell, { width: COLUMN_WIDTH }]}>
                        <Text style={styles.headerTextTime}>{timeParts[0]}</Text>
                        <Text style={styles.headerTextAmPm}>{timeParts[1]}</Text>
                    </View>
                );
            })}
        </View>
    );

    const renderRow = (item) => (
        <View key={item.rawDate} style={styles.tableRow}>
            <View style={[styles.dateCell, { width: DATE_COLUMN_WIDTH }]}>
                <Text style={styles.dateText}>{item.date}</Text>
            </View>
            {markets.map(market => {
                const result = item.times[market.id];
                const digit = (result && result.digit && result.digit !== "") ? result.digit : '*';
                const panna = (result && result.panna && result.panna !== "") ? result.panna : '***';
                const isRed = result ? result.isRed : false;

                return (
                    <View key={market.id} style={[styles.resultCell, { width: COLUMN_WIDTH }]}>
                        <Text style={[styles.digitText, isRed && digit !== '*' && styles.redText]}>
                            {digit}
                        </Text>
                        <Text style={[styles.pannaText, isRed && panna !== '***' && styles.redText]}>
                            {panna}
                        </Text>
                    </View>
                );
            })}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>PS STARLINE CHART</Text>
                </View>
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#4B0076" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

            {/* Top Navigation Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PS STARLINE CHART</Text>
            </View>

            <View style={styles.tableWrapper}>
                {/* Header - No horizontal scroll */}
                {renderHeader()}

                {/* Vertical Scroll only */}
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
        paddingTop: 45,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        marginLeft: 15,
        fontFamily: 'Poppins_600SemiBold',
    },
    tableWrapper: {
        flex: 1,
        width: SCREEN_WIDTH,
    },
    tableHeaderGroup: {
        flexDirection: 'row',
        backgroundColor: '#4E0E32',
    },
    headerCell: {
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.2,
        borderRightColor: '#fff',
    },
    headerText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    headerTextTime: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    headerTextAmPm: {
        color: '#fff',
        fontSize: 6,
        marginTop: -1,
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    dateCell: {
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#eee',
        backgroundColor: '#fdfdfd',
    },
    dateText: {
        fontSize: 7,
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 9,
    },
    resultCell: {
        paddingVertical: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.2,
        borderRightColor: '#eee',
    },
    digitText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    pannaText: {
        fontSize: 6,
        color: '#888',
        marginTop: -1,
    },
    redText: {
        color: '#D32F2F',
    },
    verticalScroll: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default StarlineChart;
