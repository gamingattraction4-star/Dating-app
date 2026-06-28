// SparkMatch — Premium Edit Profile Screen
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Image, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../theme';
import { useAppStore } from '../../store/appStore';
import { userService } from '../../services/userService';
import { Profile } from '../../types';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen({ navigation }: any) {
  const { myProfile, setMyProfile } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Local form state
  const [form, setForm] = useState<Partial<Profile>>({
    displayName: '',
    bio: '',
    jobTitle: '',
    company: '',
    school: '',
    city: '',
    heightCm: 0,
    drinking: undefined,
    smoking: undefined,
    lookingFor: undefined,
    gender: 'OTHER',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // If we already have myProfile in store, use it to prefill quickly
      if (myProfile) {
        setForm({
          displayName: myProfile.displayName || '',
          bio: myProfile.bio || '',
          jobTitle: myProfile.jobTitle || '',
          company: myProfile.company || '',
          school: myProfile.school || '',
          city: myProfile.city || '',
          heightCm: myProfile.heightCm || 0,
          drinking: myProfile.drinking,
          smoking: myProfile.smoking,
          lookingFor: myProfile.lookingFor,
          gender: myProfile.gender || 'OTHER',
        });
      }
      
      // Fetch latest from API
      const freshProfile = await userService.getMyProfile();
      setMyProfile(freshProfile);
      setForm({
        displayName: freshProfile.displayName || '',
        bio: freshProfile.bio || '',
        jobTitle: freshProfile.jobTitle || '',
        company: freshProfile.company || '',
        school: freshProfile.school || '',
        city: freshProfile.city || '',
        heightCm: freshProfile.heightCm || 0,
        drinking: freshProfile.drinking,
        smoking: freshProfile.smoking,
        lookingFor: freshProfile.lookingFor,
        gender: freshProfile.gender || 'OTHER',
      });
    } catch (e) {
      console.log('Failed to load profile for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateProfile(form);
      setMyProfile(updated);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImagePick = async (orderIndex: number) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow camera roll access to upload photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Uploading photo...', result.assets[0].uri);
        setLoading(true);
        await userService.uploadPhoto(result.assets[0].uri, orderIndex);
        // Refresh profile to get updated photo URLs
        const freshProfile = await userService.getMyProfile();
        setMyProfile(freshProfile);
      }
    } catch (e) {
      console.log('Error uploading image', e);
      Alert.alert('Error', 'Could not upload photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageDelete = async (photoId: number) => {
    try {
      setLoading(true);
      await userService.deletePhoto(photoId);
      const freshProfile = await userService.getMyProfile();
      setMyProfile(freshProfile);
    } catch (e) {
      console.log('Failed to delete', e);
      Alert.alert('Error', 'Could not delete photo.');
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoGrid = () => {
    const photos = myProfile?.photos || [];
    // Always render 6 slots for Tinder/Bumble feel
    const slots = [0, 1, 2, 3, 4, 5];

    const getPhotoForSlot = (index: number) => photos.find(p => p.orderIndex === index) || photos[index];

    return (
      <View style={styles.photoGrid}>
        {/* Large Main Photo */}
        <View style={styles.photoRow}>
          <TouchableOpacity 
            style={[styles.photoSlot, styles.photoSlotLarge]} 
            activeOpacity={0.8}
            onPress={() => getPhotoForSlot(0) ? handleImageDelete(getPhotoForSlot(0).id) : handleImagePick(0)}
          >
            {getPhotoForSlot(0) ? (
              <Image source={{ uri: getPhotoForSlot(0).photoUrl }} style={styles.photoImage} />
            ) : (
              <View style={styles.emptySlotIcon}>
                <Ionicons name="add" size={32} color={Colors.dark.textMuted} />
              </View>
            )}
            <View style={styles.photoAddBadge}>
              <Ionicons name={getPhotoForSlot(0) ? "close" : "add"} size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.photoColSmall}>
            {slots.slice(1, 3).map((index) => {
              const photo = getPhotoForSlot(index);
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.photoSlot, styles.photoSlotSmall]} 
                  activeOpacity={0.8}
                  onPress={() => photo ? handleImageDelete(photo.id) : handleImagePick(index)}
                >
                  {photo ? (
                    <Image source={{ uri: photo.photoUrl }} style={styles.photoImage} />
                  ) : (
                    <View style={styles.emptySlotIcon}>
                      <Ionicons name="add" size={24} color={Colors.dark.textMuted} />
                    </View>
                  )}
                  <View style={styles.photoAddBadgeSmall}>
                    <Ionicons name={photo ? "close" : "add"} size={12} color={Colors.white} />
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
        
        {/* Bottom Row */}
        <View style={styles.photoRowBottom}>
          {slots.slice(3, 6).map((index) => {
            const photo = getPhotoForSlot(index);
            return (
              <TouchableOpacity 
                key={index} 
                style={[styles.photoSlot, styles.photoSlotBottom]} 
                activeOpacity={0.8}
                onPress={() => photo ? handleImageDelete(photo.id) : handleImagePick(index)}
              >
                {photo ? (
                  <Image source={{ uri: photo.photoUrl }} style={styles.photoImage} />
                ) : (
                  <View style={styles.emptySlotIcon}>
                    <Ionicons name="add" size={24} color={Colors.dark.textMuted} />
                  </View>
                )}
                <View style={styles.photoAddBadgeSmall}>
                  <Ionicons name={photo ? "close" : "add"} size={12} color={Colors.white} />
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
        <Text style={styles.photoHint}>Add at least 2 photos to easily get more matches!</Text>
      </View>
    );
  };

  const renderPillChoices = (field: keyof Profile, options: string[], labels: string[]) => {
    return (
      <View style={styles.pillContainer}>
        {options.map((opt, i) => {
          const isSelected = form[field] === opt;
          return (
            <TouchableOpacity 
              key={opt}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => setForm({ ...form, [field]: opt })}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {labels[i]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={28} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.iconBtn}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Photo Grid */}
        <Text style={styles.sectionHeader}>Media</Text>
        {renderPhotoGrid()}

        {/* About Me */}
        <Text style={styles.sectionHeader}>About Me</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textArea}
            multiline
            maxLength={500}
            placeholder="A little about yourself..."
            placeholderTextColor={Colors.dark.textMuted}
            value={form.bio}
            onChangeText={(t) => setForm({ ...form, bio: t })}
          />
          <Text style={styles.charCount}>{(form.bio || '').length}/500</Text>
        </View>

        {/* Basic Info */}
        <Text style={styles.sectionHeader}>Basic Info</Text>
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Display Name"
              placeholderTextColor={Colors.dark.textMuted}
              value={form.displayName}
              onChangeText={(t) => setForm({ ...form, displayName: t })}
            />
          </View>
          <View style={styles.inputDivider} />
          
          <View style={styles.inputRow}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Job Title"
              placeholderTextColor={Colors.dark.textMuted}
              value={form.jobTitle}
              onChangeText={(t) => setForm({ ...form, jobTitle: t })}
            />
          </View>
          <View style={styles.inputDivider} />

          <View style={styles.inputRow}>
            <Ionicons name="business-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Company"
              placeholderTextColor={Colors.dark.textMuted}
              value={form.company}
              onChangeText={(t) => setForm({ ...form, company: t })}
            />
          </View>
          <View style={styles.inputDivider} />

          <View style={styles.inputRow}>
            <Ionicons name="school-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="School / University"
              placeholderTextColor={Colors.dark.textMuted}
              value={form.school}
              onChangeText={(t) => setForm({ ...form, school: t })}
            />
          </View>
          <View style={styles.inputDivider} />

          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="City"
              placeholderTextColor={Colors.dark.textMuted}
              value={form.city}
              onChangeText={(t) => setForm({ ...form, city: t })}
            />
          </View>
        </View>

        {/* More details */}
        <Text style={styles.sectionHeader}>Looking For</Text>
        {renderPillChoices('lookingFor', 
          ['RELATIONSHIP', 'CASUAL', 'FRIENDSHIP', 'NOT_SURE'],
          ['Relationship 💑', 'Casual 🥂', 'Friendship 👋', 'Not Sure 🤔']
        )}

        <Text style={styles.sectionHeader}>Gender</Text>
        {renderPillChoices('gender', 
          ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'],
          ['Male', 'Female', 'Non-Binary', 'Other']
        )}

        <Text style={styles.sectionHeader}>Drinking</Text>
        {renderPillChoices('drinking', 
          ['NEVER', 'SOMETIMES', 'OFTEN'],
          ['Never', 'Sometimes', 'Often']
        )}

        <Text style={styles.sectionHeader}>Smoking</Text>
        {renderPillChoices('smoking', 
          ['NEVER', 'SOMETIMES', 'OFTEN'],
          ['Never', 'Sometimes', 'Often']
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: 50, paddingBottom: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.bgSecondary,
  },
  iconBtn: { padding: Spacing.sm },
  headerTitle: { ...Typography.h3, color: Colors.dark.text },
  saveBtnText: { ...Typography.button, color: Colors.primary },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  
  sectionHeader: {
    ...Typography.label, color: Colors.dark.textSecondary,
    textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.xl,
  },

  // Photo Grid
  photoGrid: { width: '100%', marginBottom: Spacing.lg },
  photoRow: { flexDirection: 'row', height: 260, gap: 10, marginBottom: 10 },
  photoColSmall: { flex: 1, gap: 10, height: '100%' },
  photoSlot: {
    backgroundColor: Colors.dark.bgSecondary, borderRadius: BorderRadius.xl,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.dark.border,
    ...Shadow.sm,
  },
  photoSlotLarge: { flex: 2, height: '100%' },
  photoSlotSmall: { flex: 1 },
  photoRowBottom: { flexDirection: 'row', height: 125, gap: 10 },
  photoSlotBottom: { flex: 1 },
  photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptySlotIcon: { opacity: 0.5 },
  photoAddBadge: {
    position: 'absolute', bottom: -5, right: -5,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.dark.bg,
  },
  photoAddBadgeSmall: {
    position: 'absolute', bottom: -5, right: -5,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.dark.bg,
  },
  photoHint: { ...Typography.caption, color: Colors.dark.textMuted, marginTop: Spacing.sm, textAlign: 'center' },

  // Inputs
  inputCard: {
    backgroundColor: Colors.dark.bgSecondary, borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  textArea: {
    ...Typography.body, color: Colors.dark.text,
    minHeight: 100, textAlignVertical: 'top', paddingTop: 8,
  },
  charCount: { ...Typography.caption, color: Colors.dark.textMuted, textAlign: 'right', marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  inputIcon: { marginRight: Spacing.sm },
  textInput: { flex: 1, ...Typography.body, color: Colors.dark.text },
  inputDivider: { height: 1, backgroundColor: Colors.dark.border, marginLeft: 30 },

  // Pills
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    borderWidth: 1, borderColor: Colors.dark.border, backgroundColor: Colors.dark.bgSecondary,
    paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: BorderRadius.full,
  },
  pillSelected: {
    backgroundColor: 'rgba(255, 77, 103, 0.15)', borderColor: Colors.primary,
  },
  pillText: { ...Typography.bodySmall, color: Colors.dark.text },
  pillTextSelected: { color: Colors.primary, fontWeight: '600' },
});
