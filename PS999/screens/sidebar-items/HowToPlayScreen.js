import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function HowToPlayScreen({ navigation }) {
    const steps = [
        {
            id: 1,
            icon: 'wallet',
            iconType: 'Ionicons',
            title: 'Add Money',
            description: 'First, add money to your wallet using UPI, Bank Transfer, or other payment methods.',
        },
        {
            id: 2,
            icon: 'game-controller',
            iconType: 'Ionicons',
            title: 'Select Game',
            description: 'Choose a game from the home screen. Each game has Open and Close timings.',
        },
        {
            id: 3,
            icon: 'apps',
            iconType: 'Ionicons',
            title: 'Choose Game Type',
            description: 'Select game type like Single Digit, Jodi, Single Pana, Double Pana, Triple Pana, etc.',
        },
        {
            id: 4,
            icon: 'keypad',
            iconType: 'Ionicons',
            title: 'Enter Numbers',
            description: 'Enter your lucky numbers and the amount you want to bid.',
        },
        {
            id: 5,
            icon: 'checkmark-circle',
            iconType: 'Ionicons',
            title: 'Place Bid',
            description: 'Review your selection and click Submit to place your bid.',
        },
        {
            id: 6,
            icon: 'trophy',
            iconType: 'Ionicons',
            title: 'Win & Withdraw',
            description: 'If you win, the amount is added to your wallet. Withdraw anytime!',
        },
    ];

    const gameTypes = [
        { name: 'Single Digit', rate: '1 = 9.5', description: 'Bet on any single digit (0-9)' },
        { name: 'Jodi', rate: '1 = 95', description: 'Bet on any two digit combination (00-99)' },
        { name: 'Single Pana', rate: '1 = 140', description: 'Bet on 3 digit with all different digits' },
        { name: 'Double Pana', rate: '1 = 280', description: 'Bet on 3 digit with 2 same digits' },
        { name: 'Triple Pana', rate: '1 = 700', description: 'Bet on 3 digit with all same digits (000, 111, etc.)' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#C36578" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>How to Play</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Steps Section */}
                <Text style={styles.sectionTitle}>📖 Step by Step Guide</Text>

                {steps.map((step, index) => (
                    <View key={step.id} style={styles.stepCard}>
                        <View style={styles.stepLeft}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>{step.id}</Text>
                            </View>
                            {index < steps.length - 1 && <View style={styles.stepLine} />}
                        </View>
                        <View style={styles.stepContent}>
                            <View style={styles.stepIconContainer}>
                                <Ionicons name={step.icon} size={24} color="#C36578" />
                            </View>
                            <View style={styles.stepText}>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepDescription}>{step.description}</Text>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Game Types Section */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>🎮 Game Types & Rates</Text>

                {gameTypes.map((game, index) => (
                    <View key={index} style={styles.gameTypeCard}>
                        <View style={styles.gameTypeHeader}>
                            <Text style={styles.gameTypeName}>{game.name}</Text>
                            <View style={styles.rateChip}>
                                <Text style={styles.rateText}>{game.rate}</Text>
                            </View>
                        </View>
                        <Text style={styles.gameTypeDescription}>{game.description}</Text>
                    </View>
                ))}

                {/* Tips Section */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡 Tips</Text>
                    <Text style={styles.tipText}>• Start with small amounts to learn the game</Text>
                    <Text style={styles.tipText}>• Check game timings before placing bids</Text>
                    <Text style={styles.tipText}>• Set a daily budget and stick to it</Text>
                    <Text style={styles.tipText}>• Withdraw winnings regularly</Text>
                </View>

                <View style={{ height: 30 }} />
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
    content: {
        flex: 1,
        padding: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        marginTop: 10,
        fontFamily: 'Poppins_600SemiBold',
    },
    stepCard: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    stepLeft: {
        alignItems: 'center',
        width: 40,
    },
    stepNumber: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#C36578',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
    stepLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#C36578',
        marginVertical: 5,
    },
    stepContent: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginLeft: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    stepIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 23,
        backgroundColor: '#FFF0F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepText: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        fontFamily: 'Poppins_600SemiBold',
    },
    stepDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        fontFamily: 'Poppins_600SemiBold',
    },
    gameTypeCard: {
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
    gameTypeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    gameTypeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'Poppins_600SemiBold',
    },
    rateChip: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
    },
    rateText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
    gameTypeDescription: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'Poppins_600SemiBold',
    },
    tipsCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        fontFamily: 'Poppins_600SemiBold',
    },
    tipText: {
        fontSize: 13,
        color: '#555',
        lineHeight: 22,
        fontFamily: 'Poppins_600SemiBold',
    },
});
