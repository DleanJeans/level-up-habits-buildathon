import React from 'react';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DailyLogScreen from './src/screens/DailyLogScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import StatsScreen from './src/screens/StatsScreen';

const Tab = createBottomTabNavigator();

const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#818cf8',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={darkTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#818cf8',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: { paddingBottom: 4, height: 56 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        }}
      >
        <Tab.Screen
          name="Today"
          component={DailyLogScreen}
          options={{
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>📅</Text>,
            headerTitle: 'Level Up Habits',
          }}
        />
        <Tab.Screen
          name="Habits"
          component={HabitsScreen}
          options={{
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚡</Text>,
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
