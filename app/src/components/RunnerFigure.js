import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Polyline } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

// Chubby gold stick figure in side profile — runs while AI is generating,
// then sits when generation finishes.
export default function RunnerFigure({ isRunning }) {
  const phase  = useRef(new Animated.Value(0)).current;
  const bounceY = useRef(new Animated.Value(0)).current;

  // Limb rotations: pivots encoded in the string as "rotate(deg, cx, cy)"
  const legFront = phase.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: ['rotate(-30, 19, 37)', 'rotate(36, 19, 37)', 'rotate(-30, 19, 37)'],
  });
  const legBack = phase.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: ['rotate(36, 23, 37)', 'rotate(-30, 23, 37)', 'rotate(36, 23, 37)'],
  });
  const armFront = phase.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: ['rotate(32, 17, 17)', 'rotate(-26, 17, 17)', 'rotate(32, 17, 17)'],
  });
  const armBack = phase.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: ['rotate(-26, 17, 17)', 'rotate(32, 17, 17)', 'rotate(-26, 17, 17)'],
  });
  const bounceTranslate = bounceY.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, -3],
  });

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.timing(phase, {
          toValue:         1,
          duration:        460,
          easing:          Easing.inOut(Easing.sin),
          useNativeDriver: false,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceY, { toValue: 1, duration: 230, easing: Easing.out(Easing.quad), useNativeDriver: false }),
          Animated.timing(bounceY, { toValue: 0, duration: 230, easing: Easing.in(Easing.quad),  useNativeDriver: false }),
        ])
      ).start();
    } else {
      phase.stopAnimation();
      bounceY.stopAnimation();
      phase.setValue(0);
      bounceY.setValue(0);
    }
  }, [isRunning]);

  if (!isRunning) {
    // Sitting pose — static SVG
    return (
      <View style={{ height: 52, justifyContent: 'flex-end' }}>
        <Svg viewBox="0 0 44 56" width={40} height={48}>
          <Circle cx={22} cy={8}  r={7.5} fill="none" stroke="#C9A84C" strokeWidth={2.2} />
          <Ellipse cx={20} cy={24} rx={9} ry={11} fill="none" stroke="#C9A84C" strokeWidth={2.2} transform="rotate(-10, 20, 24)" />
          {/* Legs hanging (sitting on edge) */}
          <Polyline points="18,34 5,38 5,50"  fill="none" stroke="#C9A84C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
          <Polyline points="20,34 8,37 8,50"  fill="none" stroke="#C9A84C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {/* Arms resting */}
          <Line x1={14} y1={18} x2={4}  y2={36} stroke="#C9A84C" strokeWidth={2}   strokeLinecap="round" />
          <Line x1={14} y1={18} x2={24} y2={30} stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" opacity={0.5} />
        </Svg>
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ translateY: bounceTranslate }], height: 58, justifyContent: 'flex-end' }}>
      <Svg viewBox="0 0 44 58" width={40} height={52}>
        {/* Head (chubby, positioned forward-right) */}
        <Circle cx={26} cy={8} r={7.5} fill="none" stroke="#C9A84C" strokeWidth={2.2} />
        {/* Body (fat oval) */}
        <Ellipse cx={21} cy={25} rx={9.5} ry={12} fill="none" stroke="#C9A84C" strokeWidth={2.2} />

        {/* Back arm (faded, behind body) */}
        <AnimatedG transform={armBack}>
          <Line x1={17} y1={17} x2={25} y2={29} stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" opacity={0.4} />
        </AnimatedG>

        {/* Back leg (faded) */}
        <AnimatedG transform={legBack}>
          <Polyline points="23,37 25,47 19,56" fill="none" stroke="#C9A84C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
        </AnimatedG>

        {/* Front leg (full) */}
        <AnimatedG transform={legFront}>
          <Polyline points="19,37 17,47 24,56" fill="none" stroke="#C9A84C" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        </AnimatedG>

        {/* Front arm (full) */}
        <AnimatedG transform={armFront}>
          <Line x1={17} y1={17} x2={9} y2={29} stroke="#C9A84C" strokeWidth={2.1} strokeLinecap="round" />
        </AnimatedG>
      </Svg>
    </Animated.View>
  );
}
