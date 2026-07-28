import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Animated,
    Dimensions,
    Easing,
    Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

const MenuIcon = ({ name, type = 'Ionicons' }) => {
    const iconStyle = { marginRight: 0 };
    if (type === 'MaterialCommunityIcons') return <MaterialCommunityIcons name={name} size={22} color="#fff" style={iconStyle} />;
    if (type === 'FontAwesome5') return <FontAwesome5 name={name} size={18} color="#fff" style={iconStyle} />;
    if (type === 'MaterialIcons') return <MaterialIcons name={name} size={22} color="#fff" style={iconStyle} />;
    return <Ionicons name={name} size={22} color="#fff" style={iconStyle} />;
};

export default function Sidebar({ isVisible, onClose, userData, navigation, shareApp }) {
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const logoutScaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.ease),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.ease),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isVisible]);

    const handleLink = (screen) => {
        onClose();
        navigation.navigate(screen);
    };

    return (
        <>
        <Modal
            animationType="none"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.drawerContainer}>
                {/* Overlay - Fade In/Out */}
                <Animated.View style={[styles.drawerOverlay, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={onClose}
                    />
                </Animated.View>

                {/* Drawer Content - Slide In/Out */}
                <Animated.View style={[styles.drawerContent, { transform: [{ translateX: slideAnim }] }]}>

                    {/* Header Section */}
                    <View style={styles.drawerHeader}>
                        <View style={styles.drawerHeaderContent}>
                            <View style={styles.userAvatar}>
                                <Ionicons name="person" size={35} color="#fff" />
                            </View>
                            <View style={styles.userInfoText}>
                                <Text style={styles.userName}>{userData.name}</Text>
                                <Text style={styles.userPhone}>{userData.phone}</Text>
                                <Text style={styles.userSince}>Since {userData.date}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="#D32F2F" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
                        {/* Menu Item - Home */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={onClose}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: '#C36578' }]}>
                                <MenuIcon name="home" />
                            </View>
                            <Text style={styles.menuText}>Home</Text>
                        </TouchableOpacity>

                        {/* Menu Item - My Profile */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('MyProfile')}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: '#C36578' }]}>
                                <MenuIcon name="person" />
                            </View>
                            <Text style={styles.menuText}>My Profile</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Add Money */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('AddFund')}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: '#C36578' }]}>
                                <MenuIcon name="currency-inr" type="MaterialCommunityIcons" />
                            </View>
                            <Text style={styles.menuText}>Add Money</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Withdraw Money */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('WithdrawFund')}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: '#C36578' }]}>
                                <MenuIcon name="cash-remove" type="MaterialCommunityIcons" />
                            </View>
                            <Text style={styles.menuText}>Withdraw Money</Text>
                        </TouchableOpacity>

                        {/* Menu Item - My Bids */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('MyBids')}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: '#C36578' }]}>
                                <MenuIcon name="history" type="MaterialCommunityIcons" />
                            </View>
                            <Text style={styles.menuText}>My Bids</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Passbook */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('Passbook')}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: '#C36578' }]}>
                                <MenuIcon name="swap-horizontal" type="MaterialCommunityIcons" />
                            </View>
                            <Text style={styles.menuText}>Passbook</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Funds */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('Funds')}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: '#C36578' }]}>
                                <MenuIcon name="account-balance" type="MaterialIcons" />
                            </View>
                            <Text style={styles.menuText}>Funds</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Notification */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('Notification')}
                        >
                            <View style={styles.menuIconContainer}>
                                <MenuIcon name="notifications" />
                            </View>
                            <Text style={styles.menuText}>Notification</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Charts */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('Charts')}
                        >
                            <View style={styles.menuIconContainer}>
                                <MenuIcon name="bar-chart" />
                            </View>
                            <Text style={styles.menuText}>Charts</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Game Rate */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('GameRate')}
                        >
                            <View style={styles.menuIconContainer}>
                                <MenuIcon name="attach-money" type="MaterialIcons" />
                            </View>
                            <Text style={styles.menuText}>Game Rate</Text>
                        </TouchableOpacity>


                        {/* Menu Item - Notice board / Rules */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('NoticeBoard')}
                        >
                            <View style={styles.menuIconContainer}>
                                <MenuIcon name="clipboard-list" type="FontAwesome5" />
                            </View>
                            <Text style={styles.menuText}>Notice board / Rules</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Settings */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('Settings')}
                        >
                            <View style={styles.menuIconContainer}>
                                <MenuIcon name="settings-sharp" />
                            </View>
                            <Text style={styles.menuText}>Settings</Text>
                        </TouchableOpacity>

                        {/* Menu Item - How to Play */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('HowToPlay')}
                        >
                            <View style={styles.menuIconContainer}>
                                <MenuIcon name="play-circle" type="FontAwesome5" />
                            </View>
                            <Text style={styles.menuText}>How to Play</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Change Password */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('ChangePassword')}
                        >
                            <View style={styles.menuIconContainer}>
                                <MenuIcon name="key" />
                            </View>
                            <Text style={styles.menuText}>Change Password</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Generate MPIN */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => handleLink('MpinScreen')}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: '#C36578' }]}>
                                <MenuIcon name="lock-closed" />
                            </View>
                            <Text style={styles.menuText}>Generate MPIN</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Share App */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => { onClose(); shareApp(); }}
                        >
                            <View style={styles.menuIconContainer}>
                                <MenuIcon name="share-social" />
                            </View>
                            <Text style={styles.menuText}>Share App</Text>
                        </TouchableOpacity>

                        {/* Menu Item - Logout */}
                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            onClose();
                            setShowLogoutModal(true);
                            Animated.spring(logoutScaleAnim, {
                                toValue: 1,
                                friction: 5,
                                useNativeDriver: true,
                            }).start();
                        }}>
                            <View style={styles.menuIconContainer}>
                                <MenuIcon name="log-out-outline" />
                            </View>
                            <Text style={styles.menuText}>Logout</Text>
                        </TouchableOpacity>

                        <Text style={styles.versionText}>.</Text>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>

        {/* Custom Logout Confirmation Modal */}
        <Modal
            transparent
            visible={showLogoutModal}
            animationType="none"
            onRequestClose={() => setShowLogoutModal(false)}
        >
            <View style={styles.logoutOverlay}>
                <Animated.View style={[styles.logoutContainer, { transform: [{ scale: logoutScaleAnim }] }]}>
                    <View style={styles.logoutTopStrip} />

                    <View style={styles.logoutIconContainer}>
                        <Ionicons name="log-out-outline" size={70} color="#D32F2F" />
                    </View>

                    <Text style={styles.logoutTitle}>Logout</Text>
                    <Text style={styles.logoutMessage}>Are you sure you want to logout?</Text>

                    <View style={styles.logoutButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                logoutScaleAnim.setValue(0.8);
                                setShowLogoutModal(false);
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={async () => {
                                logoutScaleAnim.setValue(0.8);
                                setShowLogoutModal(false);
                                await AsyncStorage.multiRemove(['userName', 'userId', 'userDate']);
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                });
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    drawerContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    drawerOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: '100%',
        height: '100%',
    },
    drawerContent: {
        width: DRAWER_WIDTH,
        height: '100%',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 20,
        paddingTop: 45,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff', // Or keep transparent if you want
    },
    drawerHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#C36578', // Matching reddish tone
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    userInfoText: {
        justifyContent: 'center',
    },
    userName: {
        fontSize: 18,
        color: '#333',
        fontFamily: 'Roboto_700Bold',
    },
    userPhone: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
        fontFamily: 'Roboto_700Bold',
    },
    userSince: {
        fontSize: 12,
        color: '#719CB0', // Blue-ish tone from screenshot
        marginTop: 2,
        fontFamily: 'Roboto_700Bold',
    },
    closeButton: {
        padding: 5,
        marginTop: 0,
    },
    menuItems: {
        flex: 1,
        paddingVertical: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#C36578', // Reddish/Pink circle
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        // Add shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5, // Even deeper
        },
        shadowOpacity: 0.6, // Stronger opacity
        shadowRadius: 6,
        elevation: 10, // Higher elevation
    },
    menuText: {
        fontSize: 16,
        color: '#000',
        fontFamily: 'Roboto_700Bold',
    },
    versionText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        padding: 20,
        marginBottom: 20,
        fontFamily: 'Roboto_700Bold',
    },
    logoutOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutContainer: {
        width: SCREEN_WIDTH * 0.85,
        backgroundColor: '#fff',
        borderRadius: 25,
        overflow: 'hidden',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    logoutTopStrip: {
        width: '100%',
        height: 6,
        backgroundColor: '#D32F2F',
    },
    logoutIconContainer: {
        marginTop: 30,
        marginBottom: 15,
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        fontFamily: 'Poppins_600SemiBold',
    },
    logoutMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 30,
        marginBottom: 25,
        fontFamily: 'Poppins_600SemiBold',
    },
    logoutButtons: {
        flexDirection: 'row',
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 25,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 30,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Poppins_600SemiBold',
    },
    logoutButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 30,
        backgroundColor: '#D32F2F',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#D32F2F',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Poppins_600SemiBold',
    },
});
