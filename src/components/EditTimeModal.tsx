import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface Props {
  visible: boolean;
  habitName: string;
  initialTime: string; // HH:MM (24-hour)
  onSave: (hours: number, minutes: number) => void;
  onCancel: () => void;
}

/** Format a Date as "HH:MM" in 24-hour time. */
export function toHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function EditTimeModal({ visible, habitName, initialTime, onSave, onCancel }: Props) {
  const [timeStr, setTimeStr] = useState(initialTime);

  useEffect(() => {
    if (visible) setTimeStr(initialTime);
  }, [visible, initialTime]);

  function handleSave() {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
      Alert.alert('Invalid time', 'Please enter time as HH:MM (e.g. 08:30)');
      return;
    }
    const hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    if (hours > 23 || mins > 59) {
      Alert.alert('Invalid time', 'Hours must be 0–23 and minutes 0–59');
      return;
    }
    onSave(hours, mins);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <Text style={styles.editModalTitle}>Edit Log Time</Text>
          <Text style={styles.editModalHabit}>{habitName}</Text>
          <TextInput
            style={styles.timeInput}
            value={timeStr}
            onChangeText={setTimeStr}
            placeholder="HH:MM"
            placeholderTextColor="#555"
            keyboardType="numbers-and-punctuation"
            autoFocus
            selectTextOnFocus
            maxLength={5}
          />
          <View style={styles.editModalActions}>
            <TouchableOpacity style={styles.editModalSave} onPress={handleSave}>
              <Text style={styles.editModalSaveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editModalCancel} onPress={onCancel}>
              <Text style={styles.editModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModal: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    width: 280,
    alignItems: 'center',
  },
  editModalTitle: { fontSize: 18, fontWeight: '700', color: '#f0f0f0', marginBottom: 6 },
  editModalHabit: { fontSize: 14, color: '#9ca3af', marginBottom: 16 },
  timeInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#f0f0f0',
    textAlign: 'center',
    width: 120,
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 20,
  },
  editModalActions: { flexDirection: 'row', gap: 12 },
  editModalSave: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  editModalSaveText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  editModalCancel: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  editModalCancelText: { color: '#9ca3af', fontWeight: '500', fontSize: 15 },
});
