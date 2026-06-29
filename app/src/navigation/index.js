import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen     from '../screens/HomeScreen';
import LoginScreen    from '../screens/LoginScreen';
import SignupScreen   from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AIScreen       from '../screens/AIScreen';

const Stack = createStackNavigator();

const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: '#080808' },
  animationEnabled: true,
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions} initialRouteName="Home">
        <Stack.Screen name="Home"      component={HomeScreen} />
        <Stack.Screen name="Login"     component={LoginScreen} />
        <Stack.Screen name="Signup"    component={SignupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AI"        component={AIScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
