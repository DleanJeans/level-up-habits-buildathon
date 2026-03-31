import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Habit } from '../models/types';
import { getHabits, saveHabit, deleteHabit } from '../store/storage';
import HabitForm from '../components/HabitForm';

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const loadHabits = useCallback(async () => {
    const h = await getHabits();
    setHabits(h);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  async function handleSave(habit: Habit) {
    await saveHabit(habit);
    setShowForm(false);
    setEditingHabit(null);
    loadHabits();
  }

  function handleDelete(habit: Habit) {
    Alert.alert('Delete Habit', `Delete "${habit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteHabit(habit.id);
          loadHabits();
        },
      },
    ]);
  }

  function handleEdit(habit: Habit) {
    setEditingHabit(habit);
    setShowForm(true);
  }

  function renderHabit({ item }: { item: Habit }) {
    return (
      <TouchableOpacity style={styles.habitRow} onPress={() => handleEdit(item)}>
        <View style={styles.habitInfo}>
          <Text style={styles.habitName}>
            {item.type === 'checkbox' ? '☑️' : '🔢'} {item.name}
          </Text>
          <Text style={[styles.habitMeta, !item.isGood && styles.badText]}>
            {item.isGood ? '' : '❌ Bad · '}
            {item.type === 'checkbox'
              ? `${item.stars}⭐`
              : `${item.tiers?.length || 0} tiers · ${item.unit || ''}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Habits</Text>

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No habits yet. Tap + to add one!</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabit}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingHabit(null);
          setShowForm(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <HabitForm
          habit={editingHabit}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingHabit(null);
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { fontSize: 28, fontWeight: 'bold', padding: 20, paddingBottom: 10, color: '#f0f0f0' },
  list: { paddingHorizontal: 16 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginVertical: 4,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
  },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: '500', color: '#f0f0f0' },
  habitMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  badText: { color: '#f87171' },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#555', fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
