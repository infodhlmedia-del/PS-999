import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Image,
    Dimensions
} from 'react-native';
import CustomLoader from '../../components/CustomLoader';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from '../../api/auth';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ProfileItem = ({ label, value, icon, iconType = 'Ionicons' }) => (
    <View style={styles.profileItem}>
        <View style={styles.iconCircle}>
            {iconType === 'Ionicons' ? (
                <Ionicons name={icon} size={22} color="#fff" />
            ) : (
                <MaterialCommunityIcons name={icon} size={22} color="#fff" />
            )}
        </View>
        <View style={styles.itemContent}>
            <Text style={styles.itemLabel}>{label}</Text>
            <Text style={styles.itemValue}>{value || 'N/A'}</Text>
        </View>
    </View>
);

export default function MyProfileScreen({ navigation }) {
    const [profileData, setProfileData] = useState(null);
    const [sinceDate, setSinceDate] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const userId = await AsyncStorage.getItem('userId');
            const storedDate = await AsyncStorage.getItem('userDate');
            setSinceDate(storedDate || '');

            if (userId) {
                const response = await getUserProfile(userId);
                if (response && (response.status === true || response.status === 'true')) {
                    setProfileData(response.data);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={{ height: 200 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* ... profile card content ... */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={50} color="#fff" />
                            </View>
                            <Text style={styles.userName}>{profileData?.username || 'User'}</Text>
                            <Text style={styles.userPhone}>{profileData?.mobile || ''}</Text>
                        </View>

                        <View style={styles.detailsContainer}>
                            <ProfileItem
                                label="Member Since"
                                value={profileData?.created_at || profileData?.insert_date || sinceDate || '03/01/2026'}
                                icon="calendar"
                            />
                            <ProfileItem
                                label="Unique ID"
                                value={profileData?.user_id}
                                icon="id-card-outline"
                            />
                            <ProfileItem
                                label="Mobile Number"
                                value={profileData?.mobile || profileData?.phone_number}
                                icon="call-outline"
                            />
                            {/* You can add more items if the API returns them */}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('UpdateBankDetails')}
                    >
                        <MaterialCommunityIcons name="bank-plus" size={20} color="#C36578" />
                        <Text style={styles.editButtonText}>Update Bank / UPI Details</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
            <CustomLoader visible={loading} />
        </View>
    );
}

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
        paddingVertical: 15,
        paddingTop: 45,
        backgroundColor: '#F5EDE0',
    },
    backButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        borderWidth: 1,
        borderColor: '#D3D3D3',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        fontFamily: 'Poppins_600SemiBold',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        fontSize: 16,
        color: '#C36578',
        fontFamily: 'Poppins_600SemiBold',
    },
    scrollContent: {
        padding: 20,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#C36578',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 4,
        borderColor: '#f8daa7ff',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'Poppins_600SemiBold',
    },
    userPhone: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
        fontFamily: 'Poppins_600SemiBold',
    },
    detailsContainer: {
        width: '100%',
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#C36578',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemContent: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 14,
        color: '#999',
        fontFamily: 'Poppins_600SemiBold',
    },
    itemValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
        fontFamily: 'Poppins_600SemiBold',
        marginTop: 2,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#C36578',
        borderStyle: 'dashed',
    },
    editButtonText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#C36578',
        fontWeight: 'bold',
        fontFamily: 'Poppins_600SemiBold',
    },
});
