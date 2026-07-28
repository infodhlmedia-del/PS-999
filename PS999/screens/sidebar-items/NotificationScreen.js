import React, { useEffect, useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    StatusBar, 
    FlatList, 
    ActivityIndicator, 
    RefreshControl,
    Dimensions,
    Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifications } from '../../api/auth';

const { width } = Dimensions.get('window');

const getTodayDate = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getPastDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export default function NotificationScreen({ navigation }) {
    const [notificationList, setNotificationList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('results'); // 'results' or 'others'

    const fetchNotification = async () => {
        try {
            const userId = await AsyncStorage.getItem('userId');
            const today = getTodayDate();
            const lastMonth = getPastDate(30);

            const response = await notifications(userId, lastMonth, today);
            
            if (response && (response.status === true || response.status === 'true')) {
                setNotificationList(response.data || []);
            } else {
                setNotificationList([]);
            }
        } catch (error) {
            console.error("Fetch Notifications Error:", error);
            setNotificationList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotification();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotification();
    };

    const filteredList = useMemo(() => {
        if (activeTab === 'results') {
            return notificationList.filter(item => item.type?.toLowerCase() === 'win');
        } else {
            return notificationList.filter(item => item.type?.toLowerCase() !== 'win');
        }
    }, [notificationList, activeTab]);

    const getTypeStyles = (type) => {
        switch (type?.toLowerCase()) {
            case 'win':
                return { 
                    icon: 'trophy', 
                    color: '#4CAF50', 
                    bg: '#E8F5E9',
                    iconFamily: MaterialCommunityIcons 
                };
            case 'warning':
                return { 
                    icon: 'alert-circle', 
                    color: '#FF9800', 
                    bg: '#FFF3E0',
                    iconFamily: Ionicons 
                };
            case 'info':
                return { 
                    icon: 'information', 
                    color: '#2196F3', 
                    bg: '#E3F2FD',
                    iconFamily: MaterialCommunityIcons 
                };
            default:
                return { 
                    icon: 'bell', 
                    color: '#6B3A3A', 
                    bg: '#f2e3caff',
                    iconFamily: MaterialCommunityIcons 
                };
        }
    };

    const renderNotificationItem = ({ item }) => {
        const styles_type = getTypeStyles(item.type);
        const IconComponent = styles_type.iconFamily;

        return (
            <View style={styles.notificationCard}>
                <View style={[styles.typeBadge, { backgroundColor: styles_type.bg }]}>
                    <IconComponent name={styles_type.icon} size={22} color={styles_type.color} />
                </View>
                
                <View style={styles.contentContainer}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.notificationTitle} numberOfLines={1}>
                            {item.title?.replace(/[\[\]]/g, '').trim()}
                        </Text>
                       
                    </View>
                    
                    <Text style={styles.notificationMessage}>{item.message || item.msg}</Text>
                    
                    <View style={styles.cardFooter}>
                        <View style={styles.dateBadge}>
                            <Ionicons name="calendar-outline" size={12} color="#888" />
                            <Text style={styles.dateText}>{item.date}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f2e3caff" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notice Board</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <Ionicons name="refresh" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'results' && styles.activeTab]} 
                    onPress={() => setActiveTab('results')}
                >
                    <Ionicons name="trophy-outline" size={18} color={activeTab === 'results' ? '#fff' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'results' && styles.activeTabText]}>Results</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'others' && styles.activeTab]} 
                    onPress={() => setActiveTab('others')}
                >
                    <Ionicons name="apps-outline" size={18} color={activeTab === 'others' ? '#fff' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'others' && styles.activeTabText]}>Others</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {loading ? (
                    <View style={styles.centerNode}>
                        <ActivityIndicator size="large" color="#6B3A3A" />
                    </View>
                ) : filteredList.length === 0 ? (
                    <View style={styles.centerNode}>
                        <MaterialCommunityIcons 
                            name={activeTab === 'results' ? "trophy-off-outline" : "bell-sleep-outline"} 
                            size={80} 
                            color="#ccc" 
                        />
                        <Text style={styles.emptyText}>
                            {activeTab === 'results' ? 'No results found' : 'No general notices'}
                        </Text>
                        <Text style={styles.emptySubText}>
                            Check back later for new updates.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredList}
                        keyExtractor={(item) => item.id?.toString()}
                        renderItem={renderNotificationItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#6B3A3A']}
                            />
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f2e3caff' 
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 15,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    refreshBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    headerTitle: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: '#000', 
        fontFamily: 'Poppins_600SemiBold' 
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 15,
        padding: 5,
        marginBottom: 15,
        elevation: 2,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#6B3A3A',
        elevation: 4,
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        fontFamily: 'Poppins_500Medium',
        marginLeft: 8,
    },
    activeTabText: {
        color: '#fff',
    },
    content: { 
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 40,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#6B3A3A',
    },
    typeBadge: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contentContainer: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
        fontFamily: 'Poppins_600SemiBold',
        flex: 1,
        marginRight: 10,
    },
    timeLabel: {
        fontSize: 10,
        color: '#999',
        fontFamily: 'Poppins_400Regular',
    },
    notificationMessage: {
        fontSize: 13,
        color: '#555',
        lineHeight: 18,
        fontFamily: 'Poppins_400Regular',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
        paddingTop: 8,
    },
    recipientBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    recipientText: {
        fontSize: 10,
        color: '#888',
        marginLeft: 4,
        fontFamily: 'Poppins_500Medium',
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 10,
        color: '#888',
        marginLeft: 4,
        fontFamily: 'Poppins_400Regular',
    },
    centerNode: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: { 
        fontSize: 18, 
        fontWeight: 'bold',
        color: '#333', 
        marginTop: 20, 
        fontFamily: 'Poppins_600SemiBold' 
    },
    emptySubText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 10,
        fontFamily: 'Poppins_400Regular',
    }
});



