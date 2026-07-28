import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMarkets } from '../../../api/auth';

export default function MatkaChartsListScreen({ navigation }) {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMarkets = async () => {
        setLoading(true);
        try {
            const data = await getMarkets();
            if (data && (data.status === true || data.status === 'success')) {
                setMarkets(data.data);
            }
        } catch (error) {
            console.error('Error fetching markets for charts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarkets();
    }, []);


    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Game Chart List</Text>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator size="large" color="#C85C73" style={{ marginTop: 50 }} />
                ) : markets.length === 0 ? (
                    <Text style={styles.emptyText}>No charts available</Text>
                ) : (
                    markets.map((item) => (
                        <View key={item.id} style={styles.chartCard}>
                            <Text style={styles.chartName}>{item.market_name}</Text>

                            <View style={styles.buttonGroup}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => navigation.navigate('JodiChart', {
                                        marketId: item.id,
                                        marketName: item.market_name
                                    })}
                                >
                                    <Text style={styles.actionButtonText}>Jodi</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => navigation.navigate('PanelChart', {
                                        marketId: item.id,
                                        marketName: item.market_name
                                    })}
                                >
                                    <Text style={styles.actionButtonText}>Panel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

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
        gap: 15,
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
        fontFamily: 'Poppins_600SemiBold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 15,
    },
    chartCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 5, // More squared corners as per image
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    chartName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'Poppins_600SemiBold',
        flex: 1,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        backgroundColor: '#C85C73', // Pink/Red color from image
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 5,
        minWidth: 70,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Poppins_600SemiBold',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
    }
});
