// SparkMatch — Discovery Filters bottom sheet
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { userService } from '../services/userService';
import { Preferences } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
}

const GENDER_OPTIONS: Array<{ key: Preferences['genderPreference']; label: string }> = [
  { key: 'MALE', label: 'Men' },
  { key: 'FEMALE', label: 'Women' },
  { key: 'EVERYONE', label: 'Everyone' },
];

export default function FiltersSheet({ visible, onClose, onApply }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>({
    minAge: 18, maxAge: 50, maxDistanceKm: 50, genderPreference: 'EVERYONE', showMeOnApp: true, globalMode: false,
  });

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    userService.getPreferences()
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible]);

  const step = (key: 'minAge' | 'maxAge' | 'maxDistanceKm', delta: number) => {
    Haptics.selectionAsync();
    setPrefs((p) => {
      let v = p[key] + delta;
      if (key === 'minAge') v = Math.max(18, Math.min(v, p.maxAge - 1));
      if (key === 'maxAge') v = Math.max(p.minAge + 1, Math.min(v, 80));
      if (key === 'maxDistanceKm') v = Math.max(1, Math.min(v, 160));
      return { ...p, [key]: v };
    });
  };

  const apply = async () => {
    setSaving(true);
    try {
      await userService.updatePreferences({
        minAge: prefs.minAge,
        maxAge: prefs.maxAge,
        maxDistanceKm: prefs.maxDistanceKm,
        genderPreference: prefs.genderPreference,
        globalMode: prefs.globalMode,
        showMeOnApp: prefs.showMeOnApp,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onApply();
    } catch {
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Discovery Filters</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing['3xl'] }} />
          ) : (
            <>
              <Text style={styles.label}>Show me</Text>
              <View style={styles.segment}>
                {GENDER_OPTIONS.map((o) => {
                  const on = prefs.genderPreference === o.key;
                  return (
                    <TouchableOpacity
                      key={o.key}
                      style={[styles.segmentItem, on && styles.segmentItemOn]}
                      onPress={() => { Haptics.selectionAsync(); setPrefs((p) => ({ ...p, genderPreference: o.key })); }}
                    >
                      <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{o.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Stepper label="Age range" value={`${prefs.minAge} to ${prefs.maxAge}`}>
                <View style={styles.dualStepper}>
                  <MiniStepper label="Min" onDec={() => step('minAge', -1)} onInc={() => step('minAge', 1)} value={prefs.minAge} />
                  <MiniStepper label="Max" onDec={() => step('maxAge', -1)} onInc={() => step('maxAge', 1)} value={prefs.maxAge} />
                </View>
              </Stepper>

              <Stepper label="Maximum distance" value={`${prefs.maxDistanceKm} km`}>
                <View style={styles.row}>
                  <TouchableOpacity style={styles.circleBtn} onPress={() => step('maxDistanceKm', -5)}>
                    <Ionicons name="remove" size={20} color={Colors.dark.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.circleBtn} onPress={() => step('maxDistanceKm', 5)}>
                    <Ionicons name="add" size={20} color={Colors.dark.text} />
                  </TouchableOpacity>
                </View>
              </Stepper>

              <TouchableOpacity
                style={styles.globalRow}
                onPress={() => { Haptics.selectionAsync(); setPrefs((p) => ({ ...p, globalMode: !p.globalMode })); }}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.rowIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                    <Ionicons name="earth" size={18} color={Colors.neon.blue} />
                  </View>
                  <View>
                    <Text style={styles.label}>Global mode</Text>
                    <Text style={styles.hint}>Match with people anywhere</Text>
                  </View>
                </View>
                <Ionicons name={prefs.globalMode ? 'toggle' : 'toggle-outline'} size={42} color={prefs.globalMode ? Colors.primary : Colors.dark.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.globalRow}
                onPress={() => { Haptics.selectionAsync(); setPrefs((p) => ({ ...p, showMeOnApp: !p.showMeOnApp })); }}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.rowIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                    <Ionicons name="eye" size={18} color={Colors.neon.green} />
                  </View>
                  <View>
                    <Text style={styles.label}>Show me on SparkMatch</Text>
                    <Text style={styles.hint}>Turn off to hide from Discover</Text>
                  </View>
                </View>
                <Ionicons name={prefs.showMeOnApp ? 'toggle' : 'toggle-outline'} size={42} color={prefs.showMeOnApp ? Colors.primary : Colors.dark.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyBtn} onPress={apply} disabled={saving} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.applyGradient}>
                  <Text style={styles.applyText}>{saving ? 'Applying…' : 'Apply filters'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Stepper({ label, value, children }: any) {
  return (
    <View style={styles.stepperBlock}>
      <View style={styles.stepperHeader}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {children}
    </View>
  );
}

function MiniStepper({ label, value, onDec, onInc }: any) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniLabel}>{label}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.circleBtn} onPress={onDec}><Ionicons name="remove" size={18} color={Colors.dark.text} /></TouchableOpacity>
        <Text style={styles.miniValue}>{value}</Text>
        <TouchableOpacity style={styles.circleBtn} onPress={onInc}><Ionicons name="add" size={18} color={Colors.dark.text} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  backdropTouch: { flex: 1 },
  sheet: { backgroundColor: Colors.dark.bgSecondary, borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'], padding: Spacing.xl, paddingBottom: 40 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.dark.border, marginBottom: Spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { ...Typography.h3, color: Colors.dark.text },
  label: { ...Typography.label, color: Colors.dark.text },
  hint: { ...Typography.caption, color: Colors.dark.textMuted, marginTop: 2 },
  value: { ...Typography.label, color: Colors.primary },
  segment: { flexDirection: 'row', backgroundColor: Colors.dark.bg, borderRadius: BorderRadius.lg, padding: 4, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, alignItems: 'center' },
  segmentItemOn: { backgroundColor: Colors.primary },
  segmentText: { ...Typography.label, color: Colors.dark.textSecondary },
  segmentTextOn: { color: Colors.white },
  stepperBlock: { marginBottom: Spacing.lg },
  stepperHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  dualStepper: { flexDirection: 'row', gap: Spacing.lg },
  mini: { flex: 1, backgroundColor: Colors.dark.bg, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' },
  miniLabel: { ...Typography.caption, color: Colors.dark.textMuted, marginBottom: 6 },
  miniValue: { ...Typography.h3, color: Colors.dark.text, minWidth: 36, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.dark.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  globalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  applyBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.sm },
  applyGradient: { paddingVertical: Spacing.base, alignItems: 'center' },
  applyText: { ...Typography.button, color: Colors.white },
});
