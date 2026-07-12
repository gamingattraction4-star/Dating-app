// SparkMatch — Profile Screen (redesigned)
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadow, useTheme, ActiveTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { userService } from '../../services/userService';
import { swipeService } from '../../services/swipeService';
import { chatSocket } from '../../services/chatSocket';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: any) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { displayName, email } = useAuthStore();
  const { myProfile, setMyProfile, matches } = useAppStore();

  const [likesCount, setLikesCount] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      userService.getMyProfile().then(setMyProfile).catch(() => {});
      swipeService.getWhoLikedMe().then((l) => setLikesCount(l.length)).catch(() => setLikesCount(0));
    }, [setMyProfile]),
  );

  const photos = myProfile?.photos ?? [];
  const primaryPhoto = photos.find((p) => p.primary)?.photoUrl || photos[0]?.photoUrl;
  const completion = myProfile?.profileCompletePct ?? 10;

  const changeAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo access to change your picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      setUploading(true);
      await userService.uploadPhoto(result.assets[0].uri, 0);
      const fresh = await userService.getMyProfile();
      setMyProfile(fresh);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { chatSocket.disconnect(); useAuthStore.getState().logout(); } },
    ]);
  };

  const menuItems = [
    { icon: 'heart', label: 'Likes You', color: Colors.primary, onPress: () => navigation.navigate('Likes') },
    { icon: 'create', label: 'Edit Profile', color: Colors.secondary, onPress: () => navigation.navigate('EditProfile') },
    { icon: 'options', label: 'Settings', color: Colors.neon.blue, onPress: () => navigation.navigate('Settings') },
    { icon: 'help-circle', label: 'Help & Support', color: Colors.neon.green, onPress: () => navigation.navigate('Help') },
    { icon: 'shield-checkmark', label: 'Privacy Policy', color: Colors.neon.orange, onPress: () => navigation.navigate('Privacy') },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ---- Hero header with photo banner ---- */}
        <View style={styles.hero}>
          {primaryPhoto ? (
            <Image source={{ uri: primaryPhoto }} style={styles.heroBg} blurRadius={20} />
          ) : (
            <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.heroBg} />
          )}
          <LinearGradient colors={['transparent', t.bg]} style={styles.heroFade} />

          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>Profile</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrapper}>
            <TouchableOpacity activeOpacity={0.85} onPress={changeAvatar}>
              <Image
                source={primaryPhoto ? { uri: primaryPhoto } : require('../../../assets/icon.png')}
                style={styles.avatar}
              />
              <View style={styles.editAvatarBtn}>
                <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.editAvatarGradient}>
                  {uploading ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="camera" size={16} color={Colors.white} />}
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>
            {myProfile?.displayName || displayName || 'Your Name'}{myProfile?.age ? `, ${myProfile.age}` : ''}
            {myProfile?.verified && <Text>{'  '}<Ionicons name="checkmark-circle" size={18} color={Colors.verified} /></Text>}
          </Text>
          {!!(myProfile?.jobTitle || myProfile?.city) && (
            <Text style={styles.profileMeta}>
              {[myProfile?.jobTitle, myProfile?.city].filter(Boolean).join('  •  ')}
            </Text>
          )}
          <Text style={styles.profileEmail}>{email || ''}</Text>
        </View>

        {/* ---- Stat cards ---- */}
        <View style={styles.statsRow}>
          <StatCard t={t} value={likesCount} label="Likes" icon="heart" color={Colors.primary} />
          <StatCard t={t} value={matches.length} label="Matches" icon="flame" color={Colors.neon.orange} />
          <StatCard t={t} value={`${completion}%`} label="Complete" icon="ribbon" color={Colors.neon.green} />
        </View>

        {/* ---- Profile completion nudge ---- */}
        {completion < 100 && (
          <TouchableOpacity style={styles.completeCard} activeOpacity={0.85} onPress={() => navigation.navigate('EditProfile')}>
            <View style={styles.completeBarTrack}>
              <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.completeBarFill, { width: `${completion}%` }]} />
            </View>
            <Text style={styles.completeText}>
              Your profile is {completion}% complete. Add more to get more matches ✨
            </Text>
          </TouchableOpacity>
        )}

        {/* ---- Photo gallery preview ---- */}
        {photos.length > 0 && (
          <View style={styles.gallerySection}>
            <View style={styles.galleryHeader}>
              <Text style={styles.sectionLabel}>My Photos</Text>
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.manageLink}>Manage</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.xl }}>
              {photos.map((p) => (
                <Image key={p.id} source={{ uri: p.photoUrl }} style={styles.galleryImg} />
              ))}
              <TouchableOpacity style={styles.galleryAdd} onPress={changeAvatar} activeOpacity={0.8}>
                <Ionicons name="add" size={28} color={t.textMuted} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ---- Edit CTA ---- */}
        <TouchableOpacity style={styles.editProfileBtn} activeOpacity={0.85} onPress={() => navigation.navigate('EditProfile')}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.editProfileGradient}>
            <Ionicons name="create-outline" size={18} color={Colors.white} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ---- Menu ---- */}
        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={[styles.menuItem, i === menuItems.length - 1 && { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={item.onPress}>
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}22` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>SparkMatch v1.0.0 · Free forever 💛</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ t, value, label, icon, color }: { t: ActiveTheme; value: number | string; label: string; icon: any; color: string }) {
  const s = makeStyles(t);
  return (
    <View style={s.statCard}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={s.statNumber}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  // Hero
  hero: { alignItems: 'center', paddingBottom: Spacing.lg },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  heroFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: Spacing.xl, paddingTop: 56 },
  heroTitle: { ...Typography.h2, color: Colors.white },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarWrapper: { marginTop: Spacing.lg },
  avatar: { width: 116, height: 116, borderRadius: 58, borderWidth: 4, borderColor: Colors.white, backgroundColor: t.surface, ...Shadow.lg },
  editAvatarBtn: { position: 'absolute', bottom: 2, right: 2 },
  editAvatarGradient: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: t.bg },
  profileName: { ...Typography.h2, color: t.text, marginTop: Spacing.md, textAlign: 'center' },
  profileMeta: { ...Typography.body, color: t.textSecondary, marginTop: 2 },
  profileEmail: { ...Typography.caption, color: t.textMuted, marginTop: 4 },
  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.sm },
  statCard: { flex: 1, backgroundColor: t.surface, borderRadius: BorderRadius.xl, paddingVertical: Spacing.lg, alignItems: 'center', gap: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  statNumber: { ...Typography.h3, color: t.text },
  statLabel: { ...Typography.caption, color: t.textMuted },
  // Completion
  completeCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.lg, backgroundColor: t.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  completeBarTrack: { height: 8, borderRadius: 4, backgroundColor: t.bgTertiary, overflow: 'hidden' },
  completeBarFill: { height: 8, borderRadius: 4 },
  completeText: { ...Typography.caption, color: t.textSecondary, marginTop: Spacing.sm },
  // Gallery
  gallerySection: { marginTop: Spacing.xl },
  galleryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  sectionLabel: { ...Typography.label, color: t.text },
  manageLink: { ...Typography.label, color: Colors.primary },
  galleryImg: { width: 96, height: 128, borderRadius: BorderRadius.lg, backgroundColor: t.surface },
  galleryAdd: { width: 96, height: 128, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.border, backgroundColor: t.surface },
  // Edit CTA
  editProfileBtn: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  editProfileGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.base, gap: 8 },
  editProfileText: { ...Typography.button, color: Colors.white },
  // Menu
  menuSection: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, backgroundColor: t.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
  menuIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  menuLabel: { ...Typography.body, color: t.text, flex: 1 },
  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.xl, marginTop: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, backgroundColor: 'rgba(239,68,68,0.1)', gap: 8 },
  logoutText: { ...Typography.label, color: Colors.error },
  version: { ...Typography.caption, color: t.textMuted, textAlign: 'center', marginTop: Spacing.xl },
});
