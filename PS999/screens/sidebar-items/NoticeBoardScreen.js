import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function NoticeBoardScreen({ navigation }) {
    const rules = [
        { id: 1, title: 'Minimum Bid Amount', description: 'Minimum bid amount is ₹10 for all games.' },
        { id: 2, title: 'Maximum Bid Amount', description: 'Maximum bid amount is ₹10,000 per game.' },
        { id: 3, title: 'Withdrawal Time', description: 'Withdrawals are processed within 24 hours on working days.' },
        { id: 4, title: 'KYC Verification', description: 'Complete KYC verification to enable withdrawals.' },
        { id: 5, title: 'Responsible Gaming', description: 'Play responsibly. Set limits on your spending.' },
        { id: 6, title: 'Support', description: 'Contact support for any issues or queries.' },
    ];

    const notices = [
        { id: 1, title: 'App Update Available', date: '06 Jan 2026', description: 'New features and bug fixes available. Please update to the latest version.' },
        { id: 2, title: 'Holiday Notice', date: '01 Jan 2026', description: 'Games will be closed on Republic Day (26th January).' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#C36578" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notice Board / Rules</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Notices Section */}
                <Text style={styles.sectionTitle}>📢 Latest Notices</Text>
                {notices.map((notice) => (
                    <View key={notice.id} style={styles.noticeCard}>
                        <View style={styles.noticeHeader}>
                            <Ionicons name="megaphone" size={20} color="#C36578" />
                            <Text style={styles.noticeTitle}>{notice.title}</Text>
                        </View>
                        <Text style={styles.noticeDate}>{notice.date}</Text>
                        <Text style={styles.noticeDescription}>{notice.description}</Text>
                    </View>
                ))}

                {/* Rules Section */}
                <Text style={[styles.sectionTitle, { marginTop: 25 }]}>📋 Game Rules</Text>
                {rules.map((rule) => (
                    <View key={rule.id} style={styles.ruleCard}>
                        <View style={styles.ruleNumber}>
                            <Text style={styles.ruleNumberText}>{rule.id}</Text>
                        </View>
                        <View style={styles.ruleContent}>
                            <Text style={styles.ruleTitle}>{rule.title}</Text>
                            <Text style={styles.ruleDescription}>{rule.description}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
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
        backgroundColor: '#C36578',
        paddingHorizontal: 15,
        paddingVertical: 15,
        paddingTop: 45,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 15,
        paddingBottom: 60,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginTop: 10,
        fontFamily: 'Poppins_600SemiBold',
    },
    noticeCard: {
        backgroundColor: '#FFF8E7',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107',
    },
    noticeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    noticeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
        fontFamily: 'Poppins_600SemiBold',
    },
    noticeDate: {
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
        fontFamily: 'Poppins_600SemiBold',
    },
    noticeDescription: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        fontFamily: 'Poppins_600SemiBold',
    },
    ruleCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    ruleNumber: {
        width: 35,
        height: 35,
        borderRadius: 18,
        backgroundColor: '#C36578',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    ruleNumberText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
    ruleContent: {
        flex: 1,
    },
    ruleTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        fontFamily: 'Poppins_600SemiBold',
    },
    ruleDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        fontFamily: 'Poppins_600SemiBold',
    },
});
