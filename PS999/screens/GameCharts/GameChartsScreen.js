import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChartCategoryCard = ({ title, subtitle, icon, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.iconCircle}>
            <Ionicons name={icon} size={28} color="#E59866" />
        </View>
        <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.chevronCircle}>
            <Ionicons name="chevron-forward" size={18} color="#4E342E" />
        </View>
    </TouchableOpacity>
);

export default function GameChartsScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Game Chart</Text>
            </View>

            {/* Selection Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <ChartCategoryCard
                    title="Matka Chart"
                    subtitle="Jodi and Panel chart Result"
                    icon="stats-chart"
                    onPress={() => navigation.navigate('ChartsList')}
                />

                <ChartCategoryCard
                    title="Starline Chart"
                    subtitle="Starline Chart Date Time wise"
                    icon="star"
                    onPress={() => navigation.navigate("StarlineChart")}
                />

                <ChartCategoryCard
                    title="Jackpot Chart"
                    subtitle="Jackpot Chart Date Time wise"
                    icon="trophy"
                    onPress={() => navigation.navigate('JackpotChart')}
                />

                <View style={{ height: 40 }} />
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
        paddingTop: 45, // Increased to bring header down
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
        paddingTop: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12, // More squared corners as per image
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4E342E', // Dark brown as per image
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        fontFamily: 'Poppins_600SemiBold',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#444',
        marginTop: 4,
        fontFamily: 'Poppins_600SemiBold',
    },
    chevronCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F3E5DC', // Light beige/brown tint
        justifyContent: 'center',
        alignItems: 'center',
    },
});
