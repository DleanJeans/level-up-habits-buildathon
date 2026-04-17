import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Habit } from '../models/types';
import { getHabits, saveHabit, deleteHabit } from '../store/storage';
import HabitForm from '../components/HabitForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WebContainer from '../components/WebContainer';

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    setHabitToDelete(habit);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (habitToDelete) {
      await deleteHabit(habitToDelete.id);
      setShowDeleteDialog(false);
      // Wait for fade animation to complete before clearing habitToDelete
      setTimeout(() => {
        setHabitToDelete(null);
      }, 300); // Match the fade animation duration
      loadHabits();
    }
  }

  function cancelDelete() {
    setShowDeleteDialog(false);
    // Wait for fade animation to complete before clearing habitToDelete
    setTimeout(() => {
      setHabitToDelete(null);
    }, 300); // Match the fade animation duration
  }

  function handleEdit(habit: Habit) {
    setEditingHabit(habit);
    setShowForm(true);
  }

  function renderHabit({ item }: { item: Habit }) {
    if (item.isAutoHabit) return null; // Auto-habits are system-managed; hide from the editable list
    return (
      <TouchableOpacity style={styles.habitRow} onPress={() => handleEdit(item)}>
        <View style={styles.habitInfo}>
          <View style={styles.habitNameRow}>
            <MaterialCommunityIcons
              name={
                item.type === 'checkbox' ? 'checkbox-marked-outline' :
                item.type === 'numeral' ? 'numeric' :
                item.type === 'time-based' ? 'clock-outline' : 'stairs-up'
              }
              size={16}
              color="#9ca3af"
            />
            <Text style={styles.habitName}> {item.name}</Text>
            {(item.frequency && item.frequency !== 'daily') && (
              <View style={styles.freqBadge}>
                <Text style={styles.freqBadgeText}>{item.frequency}</Text>
              </View>
            )}
          </View>
          <View style={styles.habitMetaRow}>
            {item.category === 'bad' && (
              <View style={styles.starsMetaRow}>
                <MaterialCommunityIcons name="close-circle" size={12} color="#f87171" />
                <Text style={[styles.habitMeta, styles.badText]}> Bad · </Text>
              </View>
            )}
            {item.category === 'neutral' && (
              <View style={styles.starsMetaRow}>
                <MaterialCommunityIcons name="minus-circle-outline" size={12} color="#9ca3af" />
                <Text style={[styles.habitMeta, styles.neutralText]}> Neutral · </Text>
              </View>
            )}
            {item.type === 'checkbox' ? (
              <View style={styles.starsMetaRow}>
                <Text style={styles.habitMeta}>{item.stars}</Text>
                <MaterialCommunityIcons name="star" size={12} color="#facc15" />
              </View>
            ) : item.type === 'numeral' ? (
              <Text style={styles.habitMeta}>
                {`${item.conversion?.per || 1} ${item.unit || ''} = ${item.conversion?.stars || 1}⭐`}
              </Text>
            ) : item.type === 'time-based' ? (
              <Text style={styles.habitMeta}>
                {`${item.timeFrames?.length || 0} time frames`}
              </Text>
            ) : (
              <Text style={styles.habitMeta}>
                {`${item.tiers?.length || 0} tiers · ${item.unit || ''}`}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <MaterialCommunityIcons name="delete-outline" size={22} color="#9ca3af" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <WebContainer>
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
          contentContainerStyle={[styles.list, { paddingBottom: 80 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => {
          setEditingHabit(null);
          setShowForm(true);
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
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

      <ConfirmDialog
        visible={showDeleteDialog}
        title={`Delete Habit: ${habitToDelete ? habitToDelete.name : ''}`}
        message="This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        destructive
      />
    </View>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { fontSize: 26, fontWeight: 'bold', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, color: '#f0f0f0' },
  list: { paddingHorizontal: 16 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    minHeight: 64,
  },
  habitInfo: { flex: 1, marginRight: 8 },
  habitNameRow: { flexDirection: 'row', alignItems: 'center' },
  habitName: { fontSize: 16, fontWeight: '500', color: '#f0f0f0' },
  habitMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  starsMetaRow: { flexDirection: 'row', alignItems: 'center' },
  habitMeta: { fontSize: 12, color: '#888' },
  badText: { color: '#f87171' },
  neutralText: { color: '#9ca3af' },
  freqBadge: { marginLeft: 6, backgroundColor: '#1e1b4b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  freqBadgeText: { fontSize: 10, color: '#818cf8', fontWeight: '600' },
  deleteBtn: { padding: 10, marginRight: -6 },
  deleteBtnText: { fontSize: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#555', fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
