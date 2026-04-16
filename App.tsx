import React, { useState, useEffect } from 'react';
import { Platform, useWindowDimensions, Keyboard, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Updates from 'expo-updates';
import DailyLogScreen from './src/screens/DailyScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import TimelineScreen from './src/screens/TimelineScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#818cf8',
  },
};

export default function App() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    // Check for OTA updates on app start (only in production builds)
    async function checkForUpdates() {
      if (!__DEV__) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            Alert.alert(
              'Update Available',
              'A new update has been downloaded. Restart the app to apply it.',
              [
                {
                  text: 'Restart Now',
                  onPress: async () => {
                    await Updates.reloadAsync();
                  },
                },
                {
                  text: 'Later',
                  style: 'cancel',
                },
              ]
            );
          }
        } catch (error) {
          console.error('Error checking for updates:', error);
        }
      }
    }

    checkForUpdates();

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer theme={darkTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          tabBarPosition: isLandscape ? 'left' : 'bottom',
          headerShown: true,
          tabBarActiveTintColor: '#a5b4fc',
          tabBarInactiveTintColor: '#4b5563',
          tabBarItemStyle: isLandscape
            ? { height: 64, justifyContent: 'center' }
            : { height: 72, paddingVertical: 8 },
          tabBarStyle: isLandscape ? {
            width: Platform.OS === 'web' ? 200 : 80,
            borderRightWidth: 1,
            borderRightColor: '#2a2a2a',
            borderTopWidth: 0,
          } : (keyboardVisible ? { display: 'none' } : {
            paddingTop: 0,
            paddingBottom: 8,
            height: 72,
            ...(Platform.OS === 'web' ? {
              maxWidth: 600,
              alignSelf: 'center' as const,
              width: '100%',
              borderTopWidth: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            } : {}),
          }),
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIconStyle: isLandscape ? {} : { marginBottom: -2 },
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#2a2a2a',
          },
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
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cog-outline" size={22} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
}
