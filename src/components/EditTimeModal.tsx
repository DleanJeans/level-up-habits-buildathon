import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

function parseHHMM(hhmm: string): Date {
  const [h, m] = (hhmm || '12:00').split(':').map(Number);
  const d = new Date();
  d.setHours(isNaN(h) ? 12 : h, isNaN(m) ? 0 : m, 0, 0);
  return d;
}

export default function EditTimeModal({ visible, habitName, initialTime, onSave, onCancel }: Props) {
  const [date, setDate] = useState(() => parseHHMM(initialTime));
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setDate(parseHHMM(initialTime));
      setShowAndroidPicker(false);
    }
  }, [visible, initialTime]);

  function handleChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
      if (_event.type === 'dismissed') return;
    }
    if (selected) setDate(selected);
  }

  function handleSave() {
    onSave(date.getHours(), date.getMinutes());
  }

  const actions = (
    <View style={styles.editModalActions}>
      <TouchableOpacity style={styles.editModalSave} onPress={handleSave}>
        <Text style={styles.editModalSaveText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.editModalCancel} onPress={onCancel}>
        <Text style={styles.editModalCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  // Android: DateTimePicker is its own dialog; show a tappable time display in the modal
  if (Platform.OS === 'android') {
    return (
      <>
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
          <View style={styles.modalOverlay}>
            <View style={styles.editModal}>
              <Text style={styles.editModalTitle}>Edit Log Time</Text>
              <Text style={styles.editModalHabit}>{habitName}</Text>
              <TouchableOpacity style={styles.androidTimeDisplay} onPress={() => setShowAndroidPicker(true)}>
                <Text style={styles.androidTimeText}>
                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <MaterialCommunityIcons name="clock-edit-outline" size={20} color="#818cf8" />
              </TouchableOpacity>
              {actions}
            </View>
          </View>
        </Modal>
        {showAndroidPicker && (
          <DateTimePicker value={date} mode="time" onChange={handleChange} />
        )}
      </>
    );
  }

  // Web: native HTML time input
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.editModalTitle}>Edit Log Time</Text>
            <Text style={styles.editModalHabit}>{habitName}</Text>
            {/* @ts-ignore – HTML element supported by React Native Web */}
            <input
              type="time"
              value={toHHMM(date)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const [h, m] = (e.target.value || '').split(':').map(Number);
                if (!isNaN(h) && !isNaN(m)) {
                  const d = new Date(date);
                  d.setHours(h, m, 0, 0);
                  setDate(d);
                }
              }}
              style={{
                fontSize: 28,
                fontWeight: '600',
                color: '#f0f0f0',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: 8,
                padding: '10px 16px',
                marginBottom: 20,
                outline: 'none',
                colorScheme: 'dark',
              } as React.CSSProperties}
            />
            {actions}
          </View>
        </View>
      </Modal>
    );
  }

  // iOS: inline spinner DateTimePicker inside the modal
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <Text style={styles.editModalTitle}>Edit Log Time</Text>
          <Text style={styles.editModalHabit}>{habitName}</Text>
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            onChange={handleChange}
            style={styles.iosPicker}
            textColor="#f0f0f0"
          />
          {actions}
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
    width: 300,
    alignItems: 'center',
  },
  editModalTitle: { fontSize: 18, fontWeight: '700', color: '#f0f0f0', marginBottom: 6 },
  editModalHabit: { fontSize: 14, color: '#9ca3af', marginBottom: 16 },
  iosPicker: { width: 200, marginBottom: 12 },
  // Android time display button
  androidTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  androidTimeText: { fontSize: 32, fontWeight: '600', color: '#f0f0f0' },
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
