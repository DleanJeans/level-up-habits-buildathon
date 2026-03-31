import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLast7DayTotals } from '../store/storage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = 32;
const BAR_GAP = 8;

export default function StatsScreen() {
  const [data, setData] = useState<{ date: string; totalStars: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const totals = await getLast7DayTotals();
        setData(totals);
      })();
    }, [])
  );

  const maxStars = Math.max(...data.map((d) => d.totalStars), 1);
  const chartWidth = SCREEN_WIDTH - CHART_PADDING * 2;
  const barWidth = (chartWidth - BAR_GAP * 6) / 7;
  const chartHeight = 200;

  function shortDate(dateStr: string): string {
    const parts = dateStr.split('-');
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Weekly Stars</Text>
      <Text style={styles.subtitle}>Last 7 days</Text>

      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{maxStars.toFixed(1).replace(/\.0$/, '')}</Text>
          <Text style={styles.yLabel}>{(maxStars / 2).toFixed(1).replace(/\.0$/, '')}</Text>
          <Text style={styles.yLabel}>0</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((d, i) => {
            const barHeight = maxStars > 0 ? (d.totalStars / maxStars) * chartHeight : 0;
            return (
              <View key={d.date} style={styles.barCol}>
                <View style={[styles.barWrapper, { height: chartHeight }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(barHeight, 2),
                        width: barWidth,
                        backgroundColor: d.totalStars >= 0 ? '#4f46e5' : '#dc2626',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>
                  {d.totalStars.toFixed(1).replace(/\.0$/, '')}
                </Text>
                <Text style={styles.barLabel}>{shortDate(d.date)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {data.reduce((s, d) => s + d.totalStars, 0).toFixed(1).replace(/\.0$/, '')}
          </Text>
          <Text style={styles.summaryLabel}>Total ⭐</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {data.length > 0
              ? (data.reduce((s, d) => s + d.totalStars, 0) / data.length)
                  .toFixed(1)
                  .replace(/\.0$/, '')
              : '0'}
          </Text>
          <Text style={styles.summaryLabel}>Avg/day ⭐</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {Math.max(...data.map((d) => d.totalStars), 0)
              .toFixed(1)
              .replace(/\.0$/, '')}
          </Text>
          <Text style={styles.summaryLabel}>Best ⭐</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#f0f0f0' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  chartContainer: { flexDirection: 'row', marginBottom: 24 },
  yAxis: {
    width: 36,
    height: 200,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  yLabel: { fontSize: 10, color: '#666' },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  barCol: { alignItems: 'center' },
  barWrapper: { justifyContent: 'flex-end' },
  bar: { borderRadius: 4 },
  barValue: { fontSize: 10, color: '#818cf8', fontWeight: '600', marginTop: 4 },
  barLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#818cf8' },
  summaryLabel: { fontSize: 12, color: '#888', marginTop: 4 },
});
