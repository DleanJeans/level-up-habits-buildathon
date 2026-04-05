import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DailyLogScreen from './src/screens/DailyLogScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import TimelineScreen from './src/screens/TimelineScreen';
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
    <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer theme={darkTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#818cf8',
          tabBarInactiveTintColor: '#6b7280',
          tabBarStyle: {
            paddingTop: 4,
            paddingBottom: 8,
            height: 64,
            ...(Platform.OS === 'web' ? {
              maxWidth: 600,
              alignSelf: 'center' as const,
              width: '100%',
              borderTopWidth: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            } : {}),
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          tabBarIconStyle: { marginBottom: -2 },
          headerStyle: Platform.OS === 'web' ? {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#2a2a2a',
          } : undefined,
          headerTitleAlign: 'center',
        }}
      >
        <Tab.Screen
          name="Daily"
          component={DailyLogScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="calendar-today" size={22} color={color} />
            ),
            headerTitle: 'Level Up Habits',
          }}
        />
        <Tab.Screen
          name="Timeline"
          component={TimelineScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="timeline-clock-outline" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chart-bar" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Habits"
          component={HabitsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="lightning-bolt" size={22} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
}
