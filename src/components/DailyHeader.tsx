import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DailyHeaderProps {
  totalStars: number;
}

export default function DailyHeader({ totalStars }: DailyHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.headerTitle}>Level Up Habits</Text>
      <View style={styles.starsContainer}>
        <Text style={styles.starsValue}>
          {totalStars.toFixed(2).replace(/\.?0+$/, '')}
        </Text>
        <MaterialCommunityIcons name="star" size={20} color="#fbbf24" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
});
