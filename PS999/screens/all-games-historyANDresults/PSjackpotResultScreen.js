import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    StatusBar,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Platform,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { dateviseResultPJackpot } from '../../api/auth';

const PSjackpotResultScreen = () => {
    const navigation = useNavigation();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const formatDate = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    };

    const formatDateDisplay = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return `${day}/${month}/${year}`;
    };

    const changeDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // Prevent future dates
        if (newDate > today) return;

        setSelectedDate(newDate);
    };

    const fetchData = async () => {
        if (!refreshing) setLoading(true);
        const dateStr = formatDate(selectedDate);
        console.log('Fetching jackpot results for:', dateStr);
        try {
            const response = await dateviseResultPJackpot(dateStr);
            if (response && response.status === 'success' && response.data) {
                const results = response.data.map(item => ({
                    id: item.id || item.market_id,
                    time: item.market_name || item.end_time || "Unknown",
                    result: item.full_result || item.jodi || (
                        item.open_number && item.close_number ? `${item.open_number}-${item.close_number}` : (item.open_number || item.close_number || "***-**")
                    )
                }));
                setHistoryData(results);
            } else {
                setHistoryData([]);
            }
        } catch (error) {
            console.error('Error fetching jackpot history:', error);
            setHistoryData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [selectedDate]);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.cardTime}>{item.time}</Text>
            <Text style={styles.cardResult}>{item.result}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PS JACKPOT RESULT HISTORY</Text>
            </View>

            <View style={styles.dateSelectorContainer}>
                <Text style={styles.selectDateLabel}>Select Date</Text>
                <View style={styles.dateControls}>
                    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowButton}>
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <View style={styles.datePill}>
                        <Text style={styles.dateText}>{formatDateDisplay(selectedDate)}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => changeDate(1)}
                        style={[styles.arrowButton, { opacity: selectedDate.toDateString() === new Date().toDateString() ? 0.3 : 1 }]}
                        disabled={selectedDate.toDateString() === new Date().toDateString()}
                    >
                        <Ionicons name="chevron-forward" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#C36578" />
                </View>
            ) : (
                <FlatList
                    data={historyData}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#C36578"]} />
                    }
                />
            )}
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
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
        paddingBottom: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginLeft: 15,
        flex: 1,
    },
    dateSelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    selectDateLabel: {
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
    },
    dateControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    datePill: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 5,
        elevation: 1,
    },
    dateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    arrowButton: {
        padding: 5,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.0,
    },
    cardTime: {
        fontSize: 18,
        fontWeight: '500',
        color: '#C67C8E',
    },
    cardResult: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    }
});

export default PSjackpotResultScreen;
