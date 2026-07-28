import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Custom Icon Component for circle icons with inner circle
const CircleIcon = ({ iconType, size = 30 }) => {
    const renderIcon = () => {
        switch (iconType) {
            case 'starline-single-digit':
                return (
                    <View style={styles.iconInner}>
                        <View style={[styles.dot, { width: 14, height: 14, borderRadius: 7 }]} />
                    </View>
                );
            default:
                return <Ionicons name="help-circle" size={size} color="#fff" />;
        }
    };

    return renderIcon();
};

export default function JackpotGameDetailScreen({ navigation, route }) {
    const { gameName, gameCode, gameId, sessionTime } = route.params || {};

    const gameTypes = [
        { id: 1, name: 'Single Digit', iconType: 'Jackpot-single-digit', screen: 'JackpotSingleGame' },
        { id: 2, name: 'Jodi', iconType: 'Jackpot-jodi', screen: 'JackpotJodiGame' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5EDE0" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{gameName}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.gridContainer}>
                    {gameTypes.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={styles.gameTypeCard}
                            onPress={() => {
                                console.log('StarlineGameDetail: Navigating to', type.screen, 'with ID:', gameId, 'Time:', sessionTime);
                                navigation.navigate(type.screen, {
                                    gameName,
                                    gameCode,
                                    gameId,
                                    sessionTime,
                                    gameType: type.name,
                                    isOpenAvailable: true,
                                    isCloseAvailable: false,
                                    marketType: 'starline'
                                });
                            }}
                        >
                            <View style={styles.iconCircle}>
                                <CircleIcon iconType={type.iconType} />
                            </View>
                            <Text style={styles.gameTypeName}>{type.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
        paddingHorizontal: 15,
        paddingVertical: 12,
        paddingTop: 45,
        backgroundColor: '#F5EDE0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D0D0D0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0E8Da',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        textTransform: 'uppercase',
        fontFamily: 'Poppins_600SemiBold',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    content: {
        flex: 1,
        padding: 12,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gameTypeCard: {
        width: (SCREEN_WIDTH - 36) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 10,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#C36578',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gameTypeName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
        fontFamily: 'Poppins_600SemiBold',
    },
    iconInner: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        backgroundColor: '#fff',
    },
    cardIcon: {
        width: 24,
        height: 30,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardPlain: {
        width: 18,
        height: 24,
        borderRadius: 3,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: 'transparent',
    },
    plusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    squareTop: {
        width: 14,
        height: 14,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 3,
        marginBottom: 4,
    },
    squaresBottom: {
        flexDirection: 'row',
        gap: 6,
    },
    squareSmall: {
        width: 12,
        height: 12,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 2,
    },
    motorIcon: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    motorRing: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#fff',
        borderTopColor: 'transparent',
    },
    concentricOuter: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    concentricInner: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#fff',
    },
    hexGrid: {
        alignItems: 'center',
        gap: 2,
    },
    hexDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
});
