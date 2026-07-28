import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Animated, Easing } from 'react-native';

const CustomLoader = ({ visible }) => {
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1200, // Smooth spinning duration
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinAnim.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Exact dots configuration to match the provided image
    const dots = [
        { angle: 0,   size: 16, color: '#E3F0FF' }, // Top (Lightest Blue)
        { angle: 45,  size: 6,  color: '#081d33' }, // Top-Right (Dark Navy)
        { angle: 90,  size: 10, color: '#0d3b6e' }, // Right (Medium Navy)
        { angle: 135, size: 14, color: '#1252a0' }, // Bottom-Right (Medium Blue)
        { angle: 180, size: 18, color: '#1b63a6' }, // Bottom (Brand Blue)
        { angle: 225, size: 22, color: '#3a8fd4' }, // Bottom-Left (Bright Blue)
        { angle: 270, size: 24, color: '#6bb3e8' }, // Left (Light Blue)
        { angle: 315, size: 20, color: '#a8d4f5' }, // Top-Left (Pale Blue)
    ];

    return (
        <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <Animated.View style={[styles.spinnerContainer, { transform: [{ rotate: spin }] }]}>
                    {dots.map((dot, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dotWrapper,
                                { transform: [{ rotate: `${dot.angle}deg` }] }
                            ]}
                        >
                            <View
                                style={[
                                    styles.dot,
                                    {
                                        width: dot.size,
                                        height: dot.size,
                                        borderRadius: dot.size / 2,
                                        backgroundColor: dot.color,
                                        transform: [{ translateY: -28 }] // Distance from center
                                    }
                                ]}
                            />
                        </View>
                    ))}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotWrapper: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        position: 'absolute',
    }
});

export default CustomLoader;
