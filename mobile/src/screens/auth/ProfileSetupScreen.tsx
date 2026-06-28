// SparkMatch — Profile Setup Wizard (multi-step onboarding)
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { userService } from '../../services/userService';
import { Interest } from '../../types';

const GENDERS = [
  { key: 'MALE', label: 'Man' },
  { key: 'FEMALE', label: 'Woman' },
  { key: 'NON_BINARY', label: 'Non-binary' },
  { key: 'OTHER', label: 'Other' },
];
const LOOKING_FOR = [
  { key: 'RELATIONSHIP', label: 'Relationship 💑' },
  { key: 'CASUAL', label: 'Casual 🥂' },
  { key: 'FRIENDSHIP', label: 'Friendship 👋' },
  { key: 'NOT_SURE', label: 'Not sure 🤔' },
];
const TOTAL_STEPS = 5;

export default function ProfileSetupScreen() {
  const setProfileComplete = useAuthStore((s) => s.setProfileComplete);
  const displayNameFromAuth = useAuthStore((s) => s.displayName);
  const setMyProfile = useAppStore((s) => s.setMyProfile);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState<Interest[]>([]);

  // form state
  const [name, setName] = useState(displayNameFromAuth || '');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [city, setCity] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  const [lookingFor, setLookingFor] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    userService.getInterests().then(setInterests).catch(() => setInterests([]));
  }, []);

  const computeBirthdate = (): string | null => {
    const d = parseInt(day, 10), m = parseInt(month, 10), y = parseInt(year, 10);
    if (!d || !m || !y || y < 1920 || y > new Date().getFullYear() - 18 || m < 1 || m > 12 || d < 1 || d > 31) {
      return null;
    }
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 0: return name.trim().length >= 2 && computeBirthdate() !== null && gender !== null;
      case 1: return bio.trim().length >= 10 && city.trim().length > 0;
      case 2: return selectedInterests.length >= 1;
      case 3: return lookingFor !== null;
      default: return true;
    }
  };

  const next = () => {
    if (!canContinue()) {
      if (step === 0 && computeBirthdate() === null) {
        Alert.alert('Check your birthday', 'Enter a valid date of birth. You must be 18+.');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.selectionAsync();
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else finish();
  };

  const back = () => (step > 0 ? setStep(step - 1) : null);

  const toggleInterest = (id: number) => {
    Haptics.selectionAsync();
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev,
    );
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const requestLocation = async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Location skipped', 'You can enable it later in Settings for nearby matches.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Could not get location', 'Try again or skip for now.');
    }
  };

  const finish = async () => {
    const birthdate = computeBirthdate();
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        displayName: name.trim(),
        birthdate: birthdate || undefined,
        gender: gender || undefined,
        bio: bio.trim(),
        jobTitle: jobTitle.trim() || undefined,
        city: city.trim(),
        lookingFor: lookingFor || undefined,
        interestIds: selectedInterests,
      } as any);

      if (photoUri) {
        try { await userService.uploadPhoto(photoUri, 0); } catch { /* non-fatal */ }
      }
      if (coords) {
        try { await userService.updateLocation(coords.lat, coords.lng, city.trim() || undefined); } catch { /* non-fatal */ }
      }

      const fresh = await userService.getMyProfile().catch(() => updated);
      setMyProfile(fresh);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await setProfileComplete(true);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e?.response?.data?.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#1a0a2e', '#0F172A']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Progress */}
        <View style={styles.progressRow}>
          {step > 0 ? (
            <TouchableOpacity onPress={back} hitSlop={10}>
              <Ionicons name="chevron-back" size={26} color={Colors.white} />
            </TouchableOpacity>
          ) : <View style={{ width: 26 }} />}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{step + 1}/{TOTAL_STEPS}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <>
              <Text style={styles.stepTitle}>The basics</Text>
              <Text style={styles.stepSub}>This shows on your profile.</Text>
              <Field icon="person-outline" placeholder="First name" value={name} onChangeText={setName} />
              <Text style={styles.label}>Date of birth</Text>
              <View style={styles.dobRow}>
                <DobInput placeholder="DD" value={day} onChangeText={setDay} max={2} />
                <DobInput placeholder="MM" value={month} onChangeText={setMonth} max={2} />
                <DobInput placeholder="YYYY" value={year} onChangeText={setYear} max={4} wide />
              </View>
              <Text style={styles.label}>I am a</Text>
              <Pills options={GENDERS} selected={gender} onSelect={setGender} />
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>About you</Text>
              <Text style={styles.stepSub}>A good bio gets more matches.</Text>
              <View style={styles.bioCard}>
                <TextInput
                  style={styles.bioInput}
                  placeholder="Share something real about you…"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  maxLength={500}
                />
                <Text style={styles.charCount}>{bio.length}/500</Text>
              </View>
              <Field icon="briefcase-outline" placeholder="Job title (optional)" value={jobTitle} onChangeText={setJobTitle} />
              <Field icon="location-outline" placeholder="City" value={city} onChangeText={setCity} />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Your interests</Text>
              <Text style={styles.stepSub}>Pick up to 5. ({selectedInterests.length}/5)</Text>
              <View style={styles.interestWrap}>
                {interests.map((it) => {
                  const on = selectedInterests.includes(it.id);
                  return (
                    <TouchableOpacity
                      key={it.id}
                      style={[styles.interestChip, on && styles.interestChipOn]}
                      onPress={() => toggleInterest(it.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.interestText, on && styles.interestTextOn]}>
                        {it.icon} {it.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Looking for</Text>
              <Text style={styles.stepSub}>What brings you to SparkMatch?</Text>
              <Pills options={LOOKING_FOR} selected={lookingFor} onSelect={setLookingFor} stacked />
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.stepTitle}>Finishing touches</Text>
              <Text style={styles.stepSub}>Add a photo and enable nearby matches.</Text>
              <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto} activeOpacity={0.8}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoEmpty}>
                    <Ionicons name="camera" size={32} color={Colors.dark.textMuted} />
                    <Text style={styles.photoHint}>Add a profile photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.locBtn, coords && styles.locBtnOn]} onPress={requestLocation} activeOpacity={0.8}>
                <Ionicons name={coords ? 'checkmark-circle' : 'navigate-circle-outline'} size={22} color={coords ? Colors.success : Colors.primary} />
                <Text style={styles.locText}>{coords ? 'Location enabled' : 'Enable location'}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, (!canContinue() || saving) && { opacity: 0.5 }]}
            onPress={next}
            disabled={!canContinue() || saving}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
              {saving ? <ActivityIndicator color={Colors.white} /> : (
                <Text style={styles.ctaText}>{step < TOTAL_STEPS - 1 ? 'Continue' : 'Start matching'}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function Field({ icon, ...props }: any) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={Colors.dark.textMuted} style={{ marginRight: 10 }} />
      <TextInput style={styles.fieldInput} placeholderTextColor={Colors.dark.textMuted} {...props} />
    </View>
  );
}

function DobInput({ wide, max, ...props }: any) {
  return (
    <TextInput
      style={[styles.dobInput, wide && { flex: 1.4 }]}
      placeholderTextColor={Colors.dark.textMuted}
      keyboardType="number-pad"
      maxLength={max}
      {...props}
    />
  );
}

function Pills({ options, selected, onSelect, stacked }: any) {
  return (
    <View style={[styles.pillWrap, stacked && { flexDirection: 'column' }]}>
      {options.map((o: any) => {
        const on = selected === o.key;
        return (
          <TouchableOpacity
            key={o.key}
            style={[styles.pill, stacked && styles.pillStacked, on && styles.pillOn]}
            onPress={() => { Haptics.selectionAsync(); onSelect(o.key); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, on && styles.pillTextOn]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: 60, gap: Spacing.md },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  progressText: { ...Typography.captionBold, color: Colors.dark.textSecondary },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'], paddingBottom: Spacing.xl },
  stepTitle: { ...Typography.h1, color: Colors.white, marginBottom: Spacing.xs },
  stepSub: { ...Typography.body, color: Colors.dark.textSecondary, marginBottom: Spacing.xl },
  label: { ...Typography.label, color: Colors.dark.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  field: {
    flexDirection: 'row', alignItems: 'center', height: 56,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base, marginBottom: Spacing.base,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  fieldInput: { flex: 1, ...Typography.body, color: Colors.white, height: '100%' },
  dobRow: { flexDirection: 'row', gap: Spacing.md },
  dobInput: {
    flex: 1, height: 56, textAlign: 'center', ...Typography.h3, color: Colors.white,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.lg, paddingVertical: 12, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  pillStacked: { width: '100%', alignItems: 'center', paddingVertical: 16 },
  pillOn: { backgroundColor: 'rgba(255,77,103,0.18)', borderColor: Colors.primary },
  pillText: { ...Typography.body, color: Colors.white },
  pillTextOn: { color: Colors.primary, fontWeight: '700' },
  bioCard: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.base,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  bioInput: { ...Typography.body, color: Colors.white, minHeight: 90, textAlignVertical: 'top' },
  charCount: { ...Typography.caption, color: Colors.dark.textMuted, textAlign: 'right' },
  interestWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  interestChip: {
    paddingHorizontal: Spacing.base, paddingVertical: 10, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  interestChipOn: { backgroundColor: 'rgba(255,77,103,0.18)', borderColor: Colors.primary },
  interestText: { ...Typography.bodySmall, color: Colors.white },
  interestTextOn: { color: Colors.primary, fontWeight: '700' },
  photoPicker: { alignSelf: 'center', marginBottom: Spacing.xl },
  photoPreview: { width: 160, height: 200, borderRadius: BorderRadius.xl },
  photoEmpty: {
    width: 160, height: 200, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.dark.border,
  },
  photoHint: { ...Typography.caption, color: Colors.dark.textMuted, marginTop: Spacing.sm },
  locBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: Spacing.base, borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: Colors.dark.border,
  },
  locBtnOn: { borderColor: Colors.success },
  locText: { ...Typography.label, color: Colors.white },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: 36, paddingTop: Spacing.sm },
  cta: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  ctaGradient: { paddingVertical: Spacing.base, alignItems: 'center', borderRadius: BorderRadius.xl },
  ctaText: { ...Typography.button, color: Colors.white },
});
