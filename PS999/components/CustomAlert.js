import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CustomAlert = ({
    visible,
    title,
    message,
    onClose,
    type = 'success', // success, error, warning, info
    buttonText = 'OK'
}) => {
    const [showModal, setShowModal] = React.useState(visible);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

    React.useEffect(() => {
        if (visible) {
            setShowModal(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => setShowModal(false));
        }
    }, [visible]);

    if (!showModal) return null;

    const getIconColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            case 'warning': return '#FF9800';
            case 'info': return '#2196F3';
            default: return '#C27183';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <Ionicons name="checkmark-circle" size={80} color={getIconColor()} />;
            case 'error':
                return <MaterialCommunityIcons name="close-circle" size={80} color={getIconColor()} />;
            case 'warning':
                return <Ionicons name="warning" size={80} color={getIconColor()} />;
            case 'info':
                return <Ionicons name="information-circle" size={80} color={getIconColor()} />;
            default:
                return <Ionicons name="checkmark-circle" size={80} color={getIconColor()} />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            case 'warning': return '#FF9800';
            case 'info': return '#2196F3';
            default: return '#C27183';
        }
    };


    return (
        <Modal
            transparent
            visible={showModal}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.alertContainer,
                        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    {/* Top colored strip */}
                    <View style={[styles.topStrip, { backgroundColor: getHeaderColor() }]} />

                    <View style={styles.iconContainer}>
                        {getIcon()}
                    </View>

                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: getHeaderColor() }]}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        width: width * 0.85,
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
    topStrip: {
        width: '100%',
        height: 6,
    },
    iconContainer: {
        marginTop: 30,
        marginBottom: 15,
    },
    contentContainer: {
        paddingHorizontal: 25,
        paddingBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
        fontFamily: 'Poppins_600SemiBold'
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: 'Poppins_600SemiBold'
    },
    button: {
        width: '80%',
        paddingVertical: 15,
        borderRadius: 30,
        marginBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins_600SemiBold'
    },
});

export default CustomAlert;
