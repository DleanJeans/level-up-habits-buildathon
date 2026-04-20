import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTimeFormat, TimeFormat } from '../store/storage';

interface Props {
  visible: boolean;
  habitName: string;
  habitUnit?: string;
  onSave: (repetition: number, hours: number, minutes: number) => void;
  onCancel: () => void;
}

/** Format a Date as "HH:MM" in 24-hour time. */
function toHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Format a Date according to the time format preference. */
function formatTime(d: Date, format: TimeFormat): string {
  if (format === '12') {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return toHHMM(d);
}

export default function LogNumeralDialog({ visible, habitName, habitUnit, onSave, onCancel }: Props) {
  const [repetition, setRepetition] = useState('1');
  const [date, setDate] = useState(new Date());
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24');

  useEffect(() => {
    if (visible) {
      setRepetition('1');
      setDate(new Date());
      setShowAndroidPicker(false);
      loadTimeFormat();
    }
  }, [visible]);

  async function loadTimeFormat() {
    const format = await getTimeFormat();
    setTimeFormat(format);
  }

  function handleChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowAndroidPicker(false);
      if (_event.type === 'dismissed') return;
    }
    if (selected) setDate(selected);
  }

  function handleSave() {
    const parsedRepetition = parseInt(repetition, 10);
    if (isNaN(parsedRepetition) || parsedRepetition <= 0) {
      return;
    }
    onSave(parsedRepetition, date.getHours(), date.getMinutes());
  }

  const actions = (
    <View style={styles.dialogActions}>
      <TouchableOpacity style={styles.dialogCancel} onPress={onCancel}>
        <Text style={styles.dialogCancelText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dialogSave} onPress={handleSave}>
        <Text style={styles.dialogSaveText}>Log</Text>
      </TouchableOpacity>
    </View>
  );

  // Android: DateTimePicker is its own dialog; show a tappable time display in the modal
  if (Platform.OS === 'android') {
    return (
      <>
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
          <View style={styles.modalOverlay}>
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>Log Habit</Text>
              <Text style={styles.dialogHabit}>{habitName}</Text>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Repetition{habitUnit ? ` (${habitUnit})` : ''}</Text>
                <TextInput
                  style={styles.repetitionInput}
                  value={repetition}
                  onChangeText={setRepetition}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Time</Text>
                <TouchableOpacity style={styles.androidTimeDisplay} onPress={() => setShowAndroidPicker(true)}>
                  <Text style={styles.androidTimeText}>
                    {formatTime(date, timeFormat)}
                  </Text>
                  <MaterialCommunityIcons name="clock-edit-outline" size={18} color="#818cf8" />
                </TouchableOpacity>
              </View>

              {actions}
            </View>
          </View>
        </Modal>
        {showAndroidPicker && (
          <DateTimePicker value={date} mode="time" is24Hour={timeFormat === '24'} onChange={handleChange} />
        )}
      </>
    );
  }

  // Web: native HTML time input
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <View style={styles.modalOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Log Habit</Text>
            <Text style={styles.dialogHabit}>{habitName}</Text>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Repetition{habitUnit ? ` (${habitUnit})` : ''}</Text>
              <TextInput
                style={styles.repetitionInput}
                value={repetition}
                onChangeText={setRepetition}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Time</Text>
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
                  fontSize: 16,
                  fontWeight: '500',
                  color: '#f0f0f0',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: 8,
                  padding: '8px 12px',
                  outline: 'none',
                  colorScheme: 'dark',
                  width: '100%',
                } as React.CSSProperties}
              />
            </View>

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
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Log Habit</Text>
          <Text style={styles.dialogHabit}>{habitName}</Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Repetition{habitUnit ? ` (${habitUnit})` : ''}</Text>
            <TextInput
              style={styles.repetitionInput}
              value={repetition}
              onChangeText={setRepetition}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Time</Text>
            <DateTimePicker
              value={date}
              mode="time"
              display="spinner"
              is24Hour={timeFormat === '24'}
              onChange={handleChange}
              style={styles.iosPicker}
              textColor="#f0f0f0"
            />
          </View>

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
    padding: 20,
  },
  dialog: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#333',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0f0f0',
    marginBottom: 6,
  },
  dialogHabit: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 8,
  },
  repetitionInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#444',
  },
  androidTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  androidTimeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f0f0f0',
  },
  iosPicker: {
    width: '100%',
    height: 120,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  dialogCancel: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dialogCancelText: {
    color: '#9ca3af',
    fontWeight: '500',
    fontSize: 15,
  },
  dialogSave: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dialogSaveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
