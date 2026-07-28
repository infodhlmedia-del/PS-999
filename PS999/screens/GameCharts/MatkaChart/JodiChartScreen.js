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

const JodiChartScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { marketId, marketName } = route.params || {};

    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Grid dimensions
    const DATE_COLUMN_WIDTH = 70;
    const JODI_COLUMN_WIDTH = (SCREEN_WIDTH - DATE_COLUMN_WIDTH) / 7;

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;

        // Try manually parsing DD-MM-YYYY or YYYY-MM-DD with hyphens
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
                // Filter out invalid data, checking both result_date or date
                const validData = dataArr.filter(item => {
                    const d = item.result_date || item.date;
                    return parseDate(d) !== null;
                });
                const groupedData = groupIntoWeeks(validData);
                setChartData(groupedData);
            }
        } catch (error) {
            console.error('Error fetching Jodi chart:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const groupIntoWeeks = (data) => {
        // Matka charts usually group by Mon-Sun weeks
        const weeks = [];
        let currentWeek = null;

        // Sort data by date ascending
        const sortedData = [...data].sort((a, b) => {
            const da = parseDate(a.result_date || a.date);
            const db = parseDate(b.result_date || b.date);
            return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
        });

        sortedData.forEach(item => {
            const dateStr = item.result_date || item.date;
            const date = parseDate(dateStr);
            if (!date) return;
            const dayOfWeek = date.getDay(); // 0 is Sun, 1 is Mon...
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon:0 to Sun:6

            // Start a new week if it's Monday or if we don't have a week yet
            // Or use a more robust way based on actual date ranges
            const weekKey = getWeekStartDate(date);

            let week = weeks.find(w => w.start === weekKey);
            if (!week) {
                week = {
                    start: weekKey,
                    days: Array(7).fill(null), // Mon to Sun
                    displayDate: formatDisplayDateRange(date)
                };
                weeks.push(week);
            }
            week.days[adjustedDay] = item;
        });

        return weeks.reverse(); // Newest weeks first
    };

    const getWeekStartDate = (date) => {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "Invalid Date";
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(d.setDate(diff));
        if (isNaN(monday.getTime())) return "Invalid Date";
        return monday.toISOString().split('T')[0];
    };

    const formatDisplayDateRange = (date) => {
        const d = new Date(date);
        if (isNaN(d.getTime())) return "N/A";
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const mon = new Date(d.setDate(diff));
        if (isNaN(mon.getTime())) return "N/A";
        const sun = new Date(new Date(mon).setDate(mon.getDate() + 6));

        const f = (dt) => `${dt.getDate()}/${dt.getMonth() + 1}`;
        return `${f(mon)}\nto\n${f(sun)}`;
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
            <View style={[styles.headerDateCell, { width: DATE_COLUMN_WIDTH }]}>
                <Text style={styles.headerText}>Date</Text>
            </View>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <View key={day} style={[styles.headerCell, { width: JODI_COLUMN_WIDTH }]}>
                    <Text style={styles.headerText}>{day}</Text>
                </View>
            ))}
        </View>
    );

    const renderRow = (week, index) => (
        <View key={week.start} style={styles.tableRow}>
            <View style={[styles.dateCell, { width: DATE_COLUMN_WIDTH }]}>
                <Text style={styles.dateText}>{week.displayDate}</Text>
            </View>
            {week.days.map((day, idx) => {
                const jodi = day ? (day.combined_digit || day.jodi || day.last_digit || '**') : '**';
                const isRed = checkIsRed(jodi);
                return (
                    <View key={`${week.start}-${idx}`} style={[styles.jodiCell, { width: JODI_COLUMN_WIDTH }]}>
                        <Text style={[styles.jodiText, isRed && jodi !== '**' && styles.redText]}>
                            {jodi}
                        </Text>
                    </View>
                );
            })}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{marketName} JODI CHART</Text>
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
                        {chartData.map((week, idx) => renderRow(week, idx))}
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
    headerDateCell: {
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.5,
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
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    dateText: {
        fontSize: 10,
        color: '#4E0E32',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    jodiCell: {
        paddingVertical: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 0.2,
        borderRightColor: '#eee',
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

export default JodiChartScreen;
