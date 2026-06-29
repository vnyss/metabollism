import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { useFonts, CourierPrime_400Regular, CourierPrime_700Bold } from '@expo-google-fonts/courier-prime';
import { SpecialElite_400Regular } from '@expo-google-fonts/special-elite';
import AppNavigator from './src/navigation';
import { colors } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    CourierPrime_400Regular,
    CourierPrime_700Bold,
    SpecialElite_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <AppNavigator />
    </>
  );
}
