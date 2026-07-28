import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    BackHandler
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ExitModal = ({ visible, onClose, onConfirm }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

    React.useEffect(() => {
        if (visible) {
            // Reset first, then animate in
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.8);
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
            }).start();
        }
    }, [visible]);


    const handleExit = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            BackHandler.exitApp();
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    {/* Top Strip */}
                    <View style={styles.topStrip} />

                    <View style={styles.iconContainer}>
                        <Ionicons name="power-outline" size={60} color="#D32F2F" />
                    </View>
                    
                    <Text style={styles.title}>Exit App</Text>
                    <Text style={styles.message}>Are you sure you want to quit the application?</Text>
                    
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={styles.cancelButton} 
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.exitButton} 
                            onPress={handleExit}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.exitText}>Exit Now</Text>
                        </TouchableOpacity>
                    </View>
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
    container: {
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
        backgroundColor: '#D32F2F',
    },
    iconContainer: {
        marginTop: 30,
        marginBottom: 15,
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        fontFamily: 'Poppins_600SemiBold',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 30,
        marginBottom: 25,
        fontFamily: 'Poppins_600SemiBold',
    },
    buttonContainer: {
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
    cancelText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'Poppins_600SemiBold',
    },
    exitButton: {
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
    exitText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins_600SemiBold',
    },
});

export default ExitModal;
