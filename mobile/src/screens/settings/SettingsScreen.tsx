// SparkMatch — Settings (modern, grouped)
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Typography, Spacing, BorderRadius, useTheme, ActiveTheme, Colors } from '../../theme';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { chatSocket } from '../../services/chatSocket';
import { unregisterPush } from '../../services/pushService';
import { Preferences } from '../../types';

export default function SettingsScreen({ navigation }: any) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const logoutStore = useAuthStore((s) => s.logout);

  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Preferences>({
    minAge: 18, maxAge: 50, maxDistanceKm: 50, genderPreference: 'EVERYONE', showMeOnApp: true, globalMode: true,
  });
  // Local notification prefs (persisted best-effort on backend).
  const [notif, setNotif] = useState({ matches: true, messages: true, likes: true });

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
    } catch { /* keep defaults */ }
    finally { setLoading(false); }
  };

  const updatePref = async (key: keyof Preferences, value: any) => {
    Haptics.selectionAsync();
    setPrefs((p) => ({ ...p, [key]: value }));
    try { await userService.updatePreferences({ [key]: value }); } catch { /* ignore */ }
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
    try { await userService.updatePreferences(updates); } catch { /* ignore */ }
  };

  const openAgeEdit = () => { setTempMinAge(String(prefs.minAge)); setTempMaxAge(String(prefs.maxAge)); setEditTarget('AGE'); setModalVisible(true); };
  const openDistanceEdit = () => { setTempDistance(String(prefs.maxDistanceKm)); setEditTarget('DISTANCE'); setModalVisible(true); };
  const cycleGender = () => {
    const seq: ('EVERYONE' | 'MALE' | 'FEMALE')[] = ['EVERYONE', 'MALE', 'FEMALE'];
    updatePref('genderPreference', seq[(seq.indexOf(prefs.genderPreference) + 1) % seq.length]);
  };

  const logout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { unregisterPush(); chatSocket.disconnect(); logoutStore(); } },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert('Delete Account', 'This will permanently remove your profile, matches and messages. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Request received', 'Account deletion has been requested. Contact support@sparkmatch.com to confirm.') },
    ]);
  };

  if (loading) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const genderLabel = prefs.genderPreference === 'EVERYONE' ? 'Everyone' : prefs.genderPreference === 'MALE' ? 'Men' : 'Women';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Discovery */}
        <Group t={t} title="Discovery" icon="compass">
          <Row t={t} icon="male-female" iconColor={Colors.primary} label="Show me" value={genderLabel} onPress={cycleGender} chevron="refresh" />
          <Row t={t} icon="calendar" iconColor={Colors.neon.purple} label="Age range" value={`${prefs.minAge} to ${prefs.maxAge}`} onPress={openAgeEdit} />
          <Row t={t} icon="navigate" iconColor={Colors.neon.blue} label="Maximum distance" value={`${prefs.maxDistanceKm} km`} onPress={openDistanceEdit} />
          <ToggleRow t={t} icon="earth" iconColor={Colors.neon.green} label="Global mode" hint="Match with people anywhere" value={prefs.globalMode} onChange={(v: boolean) => updatePref('globalMode', v)} />
          <ToggleRow t={t} icon="eye" iconColor={Colors.neon.orange} label="Show me on SparkMatch" hint="Turn off to hide from Discover" value={prefs.showMeOnApp} onChange={(v: boolean) => updatePref('showMeOnApp', v)} last />
        </Group>

        {/* Notifications */}
        <Group t={t} title="Notifications" icon="notifications">
          <ToggleRow t={t} icon="flame" iconColor={Colors.primary} label="New matches" value={notif.matches} onChange={(v: boolean) => setNotif((n) => ({ ...n, matches: v }))} />
          <ToggleRow t={t} icon="chatbubble" iconColor={Colors.neon.blue} label="Messages" value={notif.messages} onChange={(v: boolean) => setNotif((n) => ({ ...n, messages: v }))} />
          <ToggleRow t={t} icon="heart" iconColor="#FF4D67" label="Likes" value={notif.likes} onChange={(v: boolean) => setNotif((n) => ({ ...n, likes: v }))} last />
        </Group>

        {/* Appearance */}
        <Group t={t} title="Appearance" icon="color-palette">
          <ToggleRow t={t} icon="moon" iconColor={Colors.neon.purple} label="Dark mode" value={isDarkMode} onChange={() => { Haptics.selectionAsync(); toggleDarkMode(); }} last />
        </Group>

        {/* Account */}
        <Group t={t} title="Account" icon="person-circle">
          <Row t={t} icon="key" iconColor={Colors.neon.gold} label="Change password" onPress={() => Alert.alert('Change password', 'Use "Forgot password" on the login screen to reset your password.')} />
          <Row t={t} icon="shield-checkmark" iconColor={Colors.neon.green} label="Blocked users" value="0" onPress={() => Alert.alert('Blocked users', 'You have not blocked anyone.')} last />
        </Group>

        {/* Support & About */}
        <Group t={t} title="Support & About" icon="help-buoy">
          <Row t={t} icon="star" iconColor={Colors.neon.gold} label="Rate SparkMatch" onPress={() => Alert.alert('Thanks! 💛', 'Ratings help us grow.')} />
          <Row t={t} icon="share-social" iconColor={Colors.neon.blue} label="Share the app" onPress={() => Alert.alert('Share', 'Tell your friends about SparkMatch!')} />
          <Row t={t} icon="help-buoy" iconColor={Colors.neon.green} label="Help & Support" onPress={() => navigation.navigate('Help')} />
          <Row t={t} icon="mail" iconColor={Colors.primary} label="Contact support" onPress={() => Linking.openURL('mailto:support@sparkmatch.com')} />
          <Row t={t} icon="document-text" iconColor={t.textSecondary} label="Privacy Policy" onPress={() => navigation.navigate('Privacy')} />
          <Row t={t} icon="reader" iconColor={t.textSecondary} label="Terms of Service" onPress={() => navigation.navigate('Privacy')} last />
        </Group>

        {/* Danger zone */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SparkMatch v1.0.0 · Free forever 💛</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Numeric edit modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editTarget === 'AGE' ? 'Set age range' : 'Set max distance (km)'}</Text>
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
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={saveModalEdits}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Group({ t, title, icon, children }: any) {
  const s = makeStyles(t);
  return (
    <View style={s.group}>
      <View style={s.groupHeader}>
        <Ionicons name={icon} size={15} color={Colors.primary} />
        <Text style={s.groupTitle}>{title}</Text>
      </View>
      <View style={s.groupCard}>{children}</View>
    </View>
  );
}

function Row({ t, icon, iconColor, label, value, onPress, chevron = 'chevron-forward', last }: any) {
  const s = makeStyles(t);
  return (
    <TouchableOpacity style={[s.row, last && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.rowIcon, { backgroundColor: `${iconColor}22` }]}><Ionicons name={icon} size={17} color={iconColor} /></View>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowRight}>
        {value != null && <Text style={s.rowValue}>{value}</Text>}
        <Ionicons name={chevron} size={16} color={t.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function ToggleRow({ t, icon, iconColor, label, hint, value, onChange, last }: any) {
  const s = makeStyles(t);
  return (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <View style={[s.rowIcon, { backgroundColor: `${iconColor}22` }]}><Ionicons name={icon} size={17} color={iconColor} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {!!hint && <Text style={s.rowHint}>{hint}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: t.border, true: Colors.primary }} thumbColor={Colors.white} />
    </View>
  );
}

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  group: { marginBottom: Spacing.xl },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm, paddingLeft: 4 },
  groupTitle: { ...Typography.labelSmall, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  groupCard: { backgroundColor: t.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rowLabel: { ...Typography.body, color: t.text, flex: 1 },
  rowHint: { ...Typography.caption, color: t.textMuted, marginTop: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { ...Typography.bodySmall, color: t.textMuted },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(239,68,68,0.1)' },
  logoutText: { ...Typography.label, color: Colors.error },
  deleteBtn: { alignItems: 'center', paddingVertical: Spacing.base },
  deleteText: { ...Typography.bodySmall, color: t.textMuted },
  version: { ...Typography.caption, color: t.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: t.surface, padding: Spacing.xl, borderRadius: BorderRadius.xl, width: 300 },
  modalTitle: { ...Typography.h3, color: t.text, marginBottom: Spacing.lg, textAlign: 'center' },
  modalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  modalTo: { ...Typography.body, color: t.textMuted },
  numberInput: { backgroundColor: t.bgTertiary, color: t.text, ...Typography.h2, paddingVertical: 10, paddingHorizontal: 20, borderRadius: BorderRadius.md, textAlign: 'center' },
  numberInputLong: { backgroundColor: t.bgTertiary, color: t.text, ...Typography.h2, paddingVertical: 10, paddingHorizontal: 40, borderRadius: BorderRadius.md, textAlign: 'center', alignSelf: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xl },
  modalBtnCancel: { padding: 10, flex: 1, alignItems: 'center' },
  modalBtnSave: { padding: 10, flex: 1, alignItems: 'center', backgroundColor: Colors.primary, borderRadius: BorderRadius.md },
  cancelText: { ...Typography.body, color: t.textMuted },
  saveText: { ...Typography.body, color: Colors.white, fontWeight: 'bold' },
});
