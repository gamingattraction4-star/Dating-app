// SparkMatch — Edit Profile (rich, modern)
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  StatusBar, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadow, useTheme, ActiveTheme } from '../../theme';
import { useAppStore } from '../../store/appStore';
import { userService } from '../../services/userService';
import { Profile, ProfileUpdate, Interest } from '../../types';

type PillDef = { field: keyof ProfileUpdate; label: string; icon: string; options: { v: string; l: string }[] };

const PILLS: PillDef[] = [
  { field: 'lookingFor', label: 'Looking for', icon: 'search',
    options: [
      { v: 'RELATIONSHIP', l: 'Relationship 💑' }, { v: 'CASUAL', l: 'Casual 🥂' },
      { v: 'FRIENDSHIP', l: 'Friendship 👋' }, { v: 'NOT_SURE', l: 'Not sure 🤔' },
    ] },
  { field: 'gender', label: 'Gender', icon: 'person',
    options: [{ v: 'MALE', l: 'Man' }, { v: 'FEMALE', l: 'Woman' }, { v: 'NON_BINARY', l: 'Non-binary' }, { v: 'OTHER', l: 'Other' }] },
  { field: 'workout', label: 'Workout', icon: 'barbell',
    options: [{ v: 'Everyday', l: 'Everyday' }, { v: 'Often', l: 'Often' }, { v: 'Sometimes', l: 'Sometimes' }, { v: 'Never', l: 'Never' }] },
  { field: 'drinking', label: 'Drinking', icon: 'wine',
    options: [{ v: 'NEVER', l: 'Never' }, { v: 'SOMETIMES', l: 'Sometimes' }, { v: 'OFTEN', l: 'Often' }] },
  { field: 'smoking', label: 'Smoking', icon: 'flame',
    options: [{ v: 'NEVER', l: 'Never' }, { v: 'SOMETIMES', l: 'Sometimes' }, { v: 'OFTEN', l: 'Often' }] },
  { field: 'pets', label: 'Pets', icon: 'paw',
    options: [{ v: 'Dog', l: 'Dog 🐕' }, { v: 'Cat', l: 'Cat 🐈' }, { v: 'Both', l: 'Both' }, { v: 'None', l: 'None' }, { v: 'Other', l: 'Other' }] },
  { field: 'children', label: 'Family plans', icon: 'people',
    options: [{ v: 'Want someday', l: 'Want someday' }, { v: 'Have & want more', l: 'Have & want more' }, { v: "Don't want", l: "Don't want" }, { v: 'Not sure', l: 'Not sure' }] },
  { field: 'educationLevel', label: 'Education', icon: 'school',
    options: [{ v: 'High school', l: 'High school' }, { v: 'Undergrad', l: 'Undergrad' }, { v: 'Postgrad', l: 'Postgrad' }, { v: 'PhD', l: 'PhD' }] },
  { field: 'zodiac', label: 'Zodiac', icon: 'star',
    options: ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].map((z) => ({ v: z, l: z })) },
  { field: 'religion', label: 'Religion', icon: 'moon',
    options: ['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Spiritual','Atheist','Other'].map((r) => ({ v: r, l: r })) },
];

export default function EditProfileScreen({ navigation }: any) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { myProfile, setMyProfile } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allInterests, setAllInterests] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);

  const [form, setForm] = useState<ProfileUpdate>({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [fresh, ints] = await Promise.all([
        userService.getMyProfile(),
        userService.getInterests().catch(() => []),
      ]);
      setMyProfile(fresh);
      setAllInterests(ints);
      setSelectedInterests((fresh.interests || []).map((i) => i.id));
      hydrateForm(fresh);
    } catch {
      if (myProfile) hydrateForm(myProfile);
    } finally {
      setLoading(false);
    }
  };

  const hydrateForm = (p: Profile) => {
    setForm({
      displayName: p.displayName, bio: p.bio, jobTitle: p.jobTitle, company: p.company,
      school: p.school, city: p.city, heightCm: p.heightCm, gender: p.gender,
      drinking: p.drinking, smoking: p.smoking, lookingFor: p.lookingFor,
      workout: p.workout, educationLevel: p.educationLevel, pets: p.pets, zodiac: p.zodiac,
      children: p.children, religion: p.religion, languages: p.languages, instagram: p.instagram,
    });
  };

  const set = (k: keyof ProfileUpdate, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleInterest = (id: number) => {
    Haptics.selectionAsync();
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const heightNum = form.heightCm ? Number(form.heightCm) : undefined;
      const updated = await userService.updateProfile({
        ...form,
        heightCm: heightNum && heightNum > 0 ? heightNum : undefined,
        interestIds: selectedInterests,
      });
      setMyProfile(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved ✓', 'Your profile has been updated successfully!', [
        { text: 'Great', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e?.response?.data?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pickPhoto = async (orderIndex: number) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo access to add photos.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.8 });
      if (result.canceled || !result.assets[0]) return;
      setSaving(true);
      await userService.uploadPhoto(result.assets[0].uri, orderIndex);
      const fresh = await userService.getMyProfile();
      setMyProfile(fresh);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not upload photo.');
    } finally { setSaving(false); }
  };

  const deletePhoto = async (photoId: number) => {
    try {
      setSaving(true);
      await userService.deletePhoto(photoId);
      const fresh = await userService.getMyProfile();
      setMyProfile(fresh);
    } catch { Alert.alert('Error', 'Could not delete photo.'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const photos = myProfile?.photos || [];
  const filled = Object.values(form).filter((v) => v !== undefined && v !== null && v !== '').length;
  const completion = myProfile?.profileCompletePct ?? 0;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="close" size={26} color={t.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Completion bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Profile strength</Text>
            <Text style={styles.progressPct}>{completion}%</Text>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${completion}%` }]} /></View>
          <Text style={styles.progressHint}>A complete profile gets up to 3x more matches.</Text>
        </View>

        {/* Photos */}
        <Text style={styles.section}>Photos</Text>
        <View style={styles.photoGrid}>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const photo = photos.find((p) => p.orderIndex === idx) || photos[idx];
            return (
              <TouchableOpacity
                key={idx}
                style={styles.photoSlot}
                activeOpacity={0.85}
                onPress={() => (photo ? deletePhoto(photo.id) : pickPhoto(idx))}
              >
                {photo ? (
                  <>
                    <Image source={{ uri: photo.photoUrl }} style={styles.photoImg} />
                    <View style={styles.photoBadge}><Ionicons name="close" size={13} color={Colors.white} /></View>
                  </>
                ) : (
                  <View style={styles.photoEmpty}><Ionicons name="add" size={26} color={Colors.primary} /></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>Tap a photo to remove, or a + to add. First photo is your main.</Text>

        {/* About */}
        <Text style={styles.section}>About me</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.textArea}
            multiline maxLength={500}
            placeholder="Write something that shows your personality…"
            placeholderTextColor={t.textMuted}
            value={form.bio}
            onChangeText={(v: string) => set('bio', v)}
          />
          <Text style={styles.charCount}>{(form.bio || '').length}/500</Text>
        </View>

        {/* Basics */}
        <Text style={styles.section}>Basics</Text>
        <View style={styles.card}>
          <Field t={t} icon="person-outline" placeholder="Display name" value={form.displayName} onChangeText={(v: string) => set('displayName', v)} />
          <Divider t={t} />
          <Field t={t} icon="briefcase-outline" placeholder="Job title" value={form.jobTitle} onChangeText={(v: string) => set('jobTitle', v)} />
          <Divider t={t} />
          <Field t={t} icon="business-outline" placeholder="Company" value={form.company} onChangeText={(v: string) => set('company', v)} />
          <Divider t={t} />
          <Field t={t} icon="school-outline" placeholder="School / University" value={form.school} onChangeText={(v: string) => set('school', v)} />
          <Divider t={t} />
          <Field t={t} icon="location-outline" placeholder="City" value={form.city} onChangeText={(v: string) => set('city', v)} />
          <Divider t={t} />
          <Field t={t} icon="resize-outline" placeholder="Height (cm)" keyboardType="number-pad"
            value={form.heightCm ? String(form.heightCm) : ''} onChangeText={(v: string) => set('heightCm', v.replace(/[^0-9]/g, ''))} />
          <Divider t={t} />
          <Field t={t} icon="language-outline" placeholder="Languages (e.g. Hindi, English)" value={form.languages} onChangeText={(v: string) => set('languages', v)} />
          <Divider t={t} />
          <Field t={t} icon="logo-instagram" placeholder="Instagram handle" autoCapitalize="none" value={form.instagram} onChangeText={(v: string) => set('instagram', v)} />
        </View>

        {/* Lifestyle pill sections */}
        {PILLS.map((p) => (
          <View key={p.field}>
            <View style={styles.sectionRow}>
              <Ionicons name={p.icon as any} size={16} color={Colors.primary} />
              <Text style={[styles.section, { marginTop: 0 }]}>{p.label}</Text>
            </View>
            <View style={styles.pillWrap}>
              {p.options.map((o) => {
                const on = (form as any)[p.field] === o.v;
                return (
                  <TouchableOpacity key={o.v} style={[styles.pill, on && styles.pillOn]} onPress={() => { Haptics.selectionAsync(); set(p.field, on ? undefined : o.v); }} activeOpacity={0.75}>
                    <Text style={[styles.pillText, on && styles.pillTextOn]}>{o.l}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Interests */}
        <View style={styles.sectionRow}>
          <Ionicons name="sparkles" size={16} color={Colors.primary} />
          <Text style={[styles.section, { marginTop: 0 }]}>Interests ({selectedInterests.length}/6)</Text>
        </View>
        <View style={styles.pillWrap}>
          {allInterests.map((i) => {
            const on = selectedInterests.includes(i.id);
            return (
              <TouchableOpacity key={i.id} style={[styles.pill, on && styles.pillOn]} onPress={() => toggleInterest(i.id)} activeOpacity={0.75}>
                <Text style={[styles.pillText, on && styles.pillTextOn]}>{i.icon} {i.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Save CTA */}
        <TouchableOpacity style={[styles.bigSave, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.9}>
          <Text style={styles.bigSaveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ t, icon, ...props }: any) {
  const s = makeStyles(t);
  return (
    <View style={s.fieldRow}>
      <Ionicons name={icon} size={19} color={t.textMuted} style={{ marginRight: 10 }} />
      <TextInput style={s.fieldInput} placeholderTextColor={t.textMuted} {...props} />
    </View>
  );
}
function Divider({ t }: any) { return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: 30 }} />; }

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: 54, paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border, backgroundColor: t.surface,
  },
  iconBtn: { padding: Spacing.xs },
  headerTitle: { ...Typography.h3, color: t.text },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: 8, borderRadius: BorderRadius.full, minWidth: 64, alignItems: 'center' },
  saveText: { ...Typography.label, color: Colors.white },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  progressCard: { backgroundColor: t.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { ...Typography.label, color: t.text },
  progressPct: { ...Typography.label, color: Colors.primary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: t.bgTertiary, overflow: 'hidden', marginTop: Spacing.sm },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  progressHint: { ...Typography.caption, color: t.textMuted, marginTop: Spacing.sm },
  section: { ...Typography.label, color: t.text, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.xl, marginBottom: Spacing.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.xl, marginBottom: Spacing.md },
  hint: { ...Typography.caption, color: t.textMuted, marginTop: Spacing.sm },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoSlot: { width: '31.5%', aspectRatio: 0.8, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: t.surface },
  photoImg: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.border, borderRadius: BorderRadius.lg },
  photoBadge: { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: t.surface, borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  textArea: { ...Typography.body, color: t.text, minHeight: 90, textAlignVertical: 'top', paddingTop: 4 },
  charCount: { ...Typography.caption, color: t.textMuted, textAlign: 'right', marginTop: 4 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  fieldInput: { flex: 1, ...Typography.body, color: t.text },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: { paddingHorizontal: Spacing.base, paddingVertical: 9, borderRadius: BorderRadius.full, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border },
  pillOn: { backgroundColor: 'rgba(255,77,103,0.14)', borderColor: Colors.primary },
  pillText: { ...Typography.bodySmall, color: t.text },
  pillTextOn: { color: Colors.primary, fontWeight: '700' },
  bigSave: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: Spacing.base, alignItems: 'center', marginTop: Spacing['2xl'], ...Shadow.md },
  bigSaveText: { ...Typography.button, color: Colors.white },
});
