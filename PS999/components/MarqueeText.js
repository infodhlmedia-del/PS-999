import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const MarqueeText = ({ text, style, containerStyle, speed = 50 }) => {
    const scrollX = useRef(new Animated.Value(0)).current;
    const textWidth = useRef(0);
    const containerWidth = useRef(0);

    useEffect(() => {
        const startAnimation = () => {
            scrollX.setValue(containerWidth.current);
            Animated.loop(
                Animated.timing(scrollX, {
                    toValue: -textWidth.current,
                    duration: (textWidth.current + containerWidth.current) * speed,
                    useNativeDriver: true,
                })
            ).start();
        };

        if (textWidth.current > 0 && containerWidth.current > 0) {
            startAnimation();
        }
    }, [textWidth.current, containerWidth.current]);

    return (
        <View
            style={[styles.container, containerStyle]}
            onLayout={(e) => {
                containerWidth.current = e.nativeEvent.layout.width;
            }}
        >
            <Animated.Text
                style={[style, { transform: [{ translateX: scrollX }] }]}
                onLayout={(e) => {
                    textWidth.current = e.nativeEvent.layout.width;
                }}
                numberOfLines={1}
            >
                {text}
            </Animated.Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        flex: 1,
    },
});

export default MarqueeText;
