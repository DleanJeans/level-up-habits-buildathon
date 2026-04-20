import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { getTimeFormat, setTimeFormat, TimeFormat } from '../store/storage';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('24');
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  async function loadSettings() {
    const format = await getTimeFormat();
    setTimeFormatState(format);
  }

  async function handleTimeFormatChange(format: TimeFormat) {
    setTimeFormatState(format);
    await setTimeFormat(format);
  }

  async function handleCheckForUpdates() {
    if (__DEV__) {
      Alert.alert(
        'Development Mode',
        'Update checks are only available in production builds. Please build and install a production version of the app to test this feature.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCheckingForUpdates(true);

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new update is available. Would you like to download and install it?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsCheckingForUpdates(false),
            },
            {
              text: 'Download',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    'Update Downloaded',
                    'The update has been downloaded. Restart the app to apply it.',
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
                        onPress: () => setIsCheckingForUpdates(false),
                      },
                    ]
                  );
                } catch (error) {
                  console.error('Error fetching update:', error);
                  Alert.alert(
                    'Download Failed',
                    'Failed to download the update. Please try again later.',
                    [{ text: 'OK', onPress: () => setIsCheckingForUpdates(false) }]
                  );
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'No Updates Available',
          'You are already running the latest version of the app.',
          [{ text: 'OK', onPress: () => setIsCheckingForUpdates(false) }]
        );
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      Alert.alert(
        'Update Check Failed',
        'Failed to check for updates. Please check your internet connection and try again.',
        [{ text: 'OK', onPress: () => setIsCheckingForUpdates(false) }]
      );
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(20, insets.bottom) },
      ]}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Display</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Time Format</Text>
            <Text style={styles.settingDescription}>
              Choose how times are displayed throughout the app
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                timeFormat === '12' && styles.toggleOptionActive,
              ]}
              onPress={() => handleTimeFormatChange('12')}
            >
              <Text
                style={[
                  styles.toggleText,
                  timeFormat === '12' && styles.toggleTextActive,
                ]}
              >
                12h
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                timeFormat === '24' && styles.toggleOptionActive,
              ]}
              onPress={() => handleTimeFormatChange('24')}
            >
              <Text
                style={[
                  styles.toggleText,
                  timeFormat === '24' && styles.toggleTextActive,
                ]}
              >
                24h
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleLabel}>Example:</Text>
          <Text style={styles.exampleTime}>
            {timeFormat === '12' ? '02:30 PM' : '14:30'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Updates</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Check for Updates</Text>
            <Text style={styles.settingDescription}>
              Manually check if a new version is available
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.updateButton, isCheckingForUpdates && styles.updateButtonDisabled]}
          onPress={handleCheckForUpdates}
          disabled={isCheckingForUpdates}
        >
          {isCheckingForUpdates ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Check for Updates</Text>
          )}
        </TouchableOpacity>
        <View style={styles.versionContainer}>
          <Text style={styles.versionLabel}>Current Version:</Text>
          <Text style={styles.versionText}>0.0.1</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0f0f0',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f0f0f0',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 2,
  },
  toggleOption: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  toggleOptionActive: {
    backgroundColor: '#6366f1',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  toggleTextActive: {
    color: '#fff',
  },
  exampleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  exampleLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginRight: 8,
  },
  exampleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a5b4fc',
  },
  updateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 48,
  },
  updateButtonDisabled: {
    backgroundColor: '#4b5563',
    opacity: 0.7,
  },
  updateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  versionLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginRight: 8,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a5b4fc',
  },
});
