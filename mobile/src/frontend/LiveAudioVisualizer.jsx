import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const Visualizer = () => {
  const bars = new Array(20).fill(0);
  const animations = bars.map(() => new Animated.Value(0));

  React.useEffect(() => {
    const animate = () => {
      const animations = bars.map(() => {
        const randomValue = Math.random() * 50;
        return Animated.sequence([
          Animated.timing(new Animated.Value(0), {
            toValue: randomValue,
            duration: 200,
            useNativeDriver: false
          }),
          Animated.timing(new Animated.Value(randomValue), {
            toValue: 100,
            duration: 200,
            useNativeDriver: false
          })
        ]);
      });

      Animated.parallel(animations).start(() => {
        animate();
      });
    };

    animate();
    
    return () => {
      animations.forEach(anim => anim.stopAnimation());
    };
  }, []);

  return (
    <View style={styles.container}>
      {bars.map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: animations[index].interpolate({
                inputRange: [0, 50],
                outputRange: ['0%', '100%']
              })
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(106, 13, 173, 0.1)',
    borderRadius: 8,
    marginTop: 10,
  },
  bar: {
    width: 3,
    backgroundColor: '#6a0dad',
    borderRadius: 2,
  }
});

export default Visualizer;