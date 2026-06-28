// SparkMatch — Fully Functional Settings Screen
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useTheme, ActiveTheme } from '../../theme';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { chatSocket } from '../../services/chatSocket';
import { Preferences } from '../../types';

export default function SettingsScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const logoutStore = useAuthStore(s => s.logout);
  const logout = () => { chatSocket.disconnect(); logoutStore(); };

  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Preferences>({
    minAge: 18, maxAge: 50, maxDistanceKm: 50,
    genderPreference: 'EVERYONE', showMeOnApp: true, globalMode: true,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<'AGE' | 'DISTANCE'>('DISTANCE');
  const [tempMinAge, setTempMinAge] = useState('18');
  const [tempMaxAge, setTempMaxAge] = useState('50');
  const [tempDistance, setTempDistance] = useState('50');

  useEffect(() => { fetchPrefs(); }, []);

  const fetchPrefs = async () => {
    try {
      setLoading(true);
      const data = await userService.getPreferences();
      setPrefs(data);
    } catch (e) {
      console.log('Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  };

  const updateServerPref = async (key: keyof Preferences, value: any) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    try {
      await userService.updatePreferences({ [key]: value });
    } catch (e) {
      console.log('Failed to save preference', key);
    }
  };

  const saveModalEdits = async () => {
    const updates: Partial<Preferences> = {};
    if (editTarget === 'AGE') {
      const mn = parseInt(tempMinAge) || 18;
      const mx = parseInt(tempMaxAge) || 50;
      updates.minAge = mn; updates.maxAge = mx;
      setPrefs({ ...prefs, minAge: mn, maxAge: mx });
    } else {
      const dist = parseInt(tempDistance) || 50;
      updates.maxDistanceKm = dist;
      setPrefs({ ...prefs, maxDistanceKm: dist });
    }
    setModalVisible(false);
    try { await userService.updatePreferences(updates); } catch (e) { console.log('Failed to save edits'); }
  };

  const openAgeEdit = () => {
    setTempMinAge(prefs.minAge.toString());
    setTempMaxAge(prefs.maxAge.toString());
    setEditTarget('AGE'); setModalVisible(true);
  };
  const openDistanceEdit = () => {
    setTempDistance(prefs.maxDistanceKm.toString());
    setEditTarget('DISTANCE'); setModalVisible(true);
  };
  const toggleGenderPref = () => {
    const sequence: ('EVERYONE' | 'MALE' | 'FEMALE')[] = ['EVERYONE', 'MALE', 'FEMALE'];
    const nextIdx = (sequence.indexOf(prefs.genderPreference) + 1) % sequence.length;
    updateServerPref('genderPreference', sequence[nextIdx]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discovery</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingRow} onPress={toggleGenderPref} activeOpacity={0.7}>
              <Text style={styles.settingLabel}>Show Me</Text>
              <View style={styles.detailRight}>
                <Text style={styles.detailText}>
                  {prefs.genderPreference === 'EVERYONE' ? 'Everyone' : prefs.genderPreference === 'MALE' ? 'Men' : 'Women'}
                </Text>
                <Ionicons name="refresh" size={16} color={t.textMuted} />
              </View>
            </TouchableOpacity>
            <View style={styles.settingBorder} />

            <TouchableOpacity style={styles.settingRow} onPress={openAgeEdit} activeOpacity={0.7}>
              <Text style={styles.settingLabel}>Age Range</Text>
              <View style={styles.detailRight}>
                <Text style={styles.detailText}>{prefs.minAge} - {prefs.maxAge}</Text>
                <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
              </View>
            </TouchableOpacity>
            <View style={styles.settingBorder} />

            <TouchableOpacity style={styles.settingRow} onPress={openDistanceEdit} activeOpacity={0.7}>
              <Text style={styles.settingLabel}>Maximum Distance</Text>
              <View style={styles.detailRight}>
                <Text style={styles.detailText}>{prefs.maxDistanceKm} km</Text>
                <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
              </View>
            </TouchableOpacity>
            <View style={styles.settingBorder} />

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Global Mode</Text>
              <Switch value={prefs.globalMode} onValueChange={(val) => updateServerPref('globalMode', val)}
                trackColor={{ false: t.border, true: t.primary }} thumbColor={t.white} />
            </View>
            <Text style={styles.hintText}>Global mode lets you match with people far away.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Controls</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Show me on SparkMatch</Text>
              <Switch value={prefs.showMeOnApp} onValueChange={(val) => updateServerPref('showMeOnApp', val)}
                trackColor={{ false: t.border, true: t.primary }} thumbColor={t.white} />
            </View>
            <Text style={styles.hintText}>If disabled, you will be hidden from the Discover feed.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch value={isDarkMode} onValueChange={toggleDarkMode}
                trackColor={{ false: t.border, true: t.primary }} thumbColor={t.white} />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SparkMatch v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editTarget === 'AGE' ? 'Set Age Range' : 'Set Max Distance (km)'}</Text>
            {editTarget === 'AGE' ? (
              <View style={styles.modalRow}>
                <TextInput style={styles.numberInput} keyboardType="numeric" maxLength={2} value={tempMinAge} onChangeText={setTempMinAge} />
                <Text style={styles.modalTo}>to</Text>
                <TextInput style={styles.numberInput} keyboardType="numeric" maxLength={2} value={tempMaxAge} onChangeText={setTempMaxAge} />
              </View>
            ) : (
              <TextInput style={styles.numberInputLong} keyboardType="numeric" maxLength={4} value={tempDistance} onChangeText={setTempDistance} />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={saveModalEdits}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.labelSmall, color: t.textMuted, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  sectionContent: { backgroundColor: t.surface, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 14 },
  settingBorder: { height: StyleSheet.hairlineWidth, backgroundColor: t.border },
  settingLabel: { ...Typography.body, color: t.text },
  detailRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { ...Typography.bodySmall, color: t.textMuted },
  hintText: { ...Typography.caption, color: t.textMuted, padding: Spacing.sm, fontStyle: 'italic' },
  logoutBtn: { paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', marginTop: Spacing.md },
  logoutText: { ...Typography.label, color: t.error },
  version: { ...Typography.caption, color: t.textMuted, textAlign: 'center', marginTop: Spacing.xl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: t.surface, padding: Spacing.xl, borderRadius: BorderRadius.xl, width: 300 },
  modalTitle: { ...Typography.h3, color: t.text, marginBottom: Spacing.lg, textAlign: 'center' },
  modalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  modalTo: { ...Typography.body, color: t.textMuted },
  numberInput: { backgroundColor: t.bgTertiary, color: t.text, ...Typography.h2, paddingVertical: 10, paddingHorizontal: 20, borderRadius: BorderRadius.md, textAlign: 'center' },
  numberInputLong: { backgroundColor: t.bgTertiary, color: t.text, ...Typography.h2, paddingVertical: 10, paddingHorizontal: 40, borderRadius: BorderRadius.md, textAlign: 'center', alignSelf: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xl },
  modalBtnCancel: { padding: 10, flex: 1, alignItems: 'center' },
  modalBtnSave: { padding: 10, flex: 1, alignItems: 'center', backgroundColor: t.primary, borderRadius: BorderRadius.md },
  cancelText: { ...Typography.body, color: t.textMuted },
  saveText: { ...Typography.body, color: t.white, fontWeight: 'bold' },
});
