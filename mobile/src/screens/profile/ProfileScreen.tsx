// SparkMatch — Profile Screen
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadow, useTheme, ActiveTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { userService } from '../../services/userService';
import { swipeService } from '../../services/swipeService';
import { chatSocket } from '../../services/chatSocket';

export default function ProfileScreen({ navigation }: any) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { displayName, email } = useAuthStore();
  const { myProfile, setMyProfile, matches } = useAppStore();

  const [likesCount, setLikesCount] = React.useState<string | number>('🔒');

  // Refresh profile + likes whenever the tab gains focus.
  useFocusEffect(
    React.useCallback(() => {
      userService.getMyProfile().then(setMyProfile).catch(() => {});
      swipeService.getWhoLikedMe()
        .then((likes) => setLikesCount(likes.length))
        .catch(() => setLikesCount('🔒'));
    }, [setMyProfile]),
  );

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => { chatSocket.disconnect(); useAuthStore.getState().logout(); },
      },
    ]);
  };

  const menuItems = [
    { icon: 'star-outline', label: 'SparkMatch Premium', color: Colors.neon.gold, badge: '✨', onPress: () => navigation.navigate('Premium') },
    { icon: 'heart-outline', label: 'Likes You', color: Colors.primary, onPress: () => navigation.navigate('Likes') },
    { icon: 'create-outline', label: 'Edit Profile', color: Colors.secondary, onPress: () => navigation.navigate('EditProfile') },
    { icon: 'settings-outline', label: 'Settings', color: t.textSecondary, onPress: () => navigation.navigate('Settings') },
    { icon: 'help-circle-outline', label: 'Help & Support', color: t.textSecondary, onPress: () => Alert.alert('Help & Support', 'Reach us at support@sparkmatch.com') },
    { icon: 'document-text-outline', label: 'Privacy Policy', color: t.textSecondary, onPress: () => Alert.alert('Privacy Policy', 'Your data is yours. Full policy at sparkmatch.com/privacy') },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color={t.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={myProfile?.photos?.[0]?.photoUrl ? { uri: myProfile.photos[0].photoUrl } : require('../../../assets/icon.png')}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.editAvatarGradient}>
                <Ionicons name="camera" size={16} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>
            {myProfile?.displayName || displayName || 'Your Name'}
            {myProfile?.age ? `, ${myProfile.age}` : ''}
          </Text>
          <Text style={styles.profileEmail}>{email || 'email@sparkmatch.com'}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{likesCount}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{matches.length}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{myProfile?.profileCompletePct ?? 10}%</Text>
              <Text style={styles.statLabel}>Profile</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity 
            style={styles.editProfileBtn} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.editProfileGradient}
            >
              <Ionicons name="create-outline" size={18} color={Colors.white} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.badge && (
                  <View style={[styles.badge, item.badge === 'NEW' && styles.newBadge]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h2, color: t.text },
  profileCard: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.md,
    backgroundColor: t.surface, borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl, alignItems: 'center', ...Shadow.md,
  },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.primary, backgroundColor: t.bgTertiary },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: -4 },
  editAvatarGradient: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: t.surface,
  },
  profileName: { ...Typography.h3, color: t.text },
  profileEmail: { ...Typography.bodySmall, color: t.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: 'row', marginTop: Spacing.xl, marginBottom: Spacing.lg,
    width: '100%', justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statNumber: { ...Typography.number, color: Colors.primary },
  statLabel: { ...Typography.caption, color: t.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: t.border },
  editProfileBtn: { width: '100%', borderRadius: BorderRadius.xl, overflow: 'hidden' },
  editProfileGradient: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: Spacing.md, borderRadius: BorderRadius.xl, gap: 8,
  },
  editProfileText: { ...Typography.button, color: Colors.white },
  menuSection: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.xl,
    backgroundColor: t.surface, borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  menuLabel: { ...Typography.body, color: t.text, flex: 1 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  newBadge: { backgroundColor: Colors.primary },
  badgeText: { ...Typography.captionBold, color: Colors.white, fontSize: 10 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: Spacing.xl, marginTop: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(239,68,68,0.1)', gap: 8,
  },
  logoutText: { ...Typography.label, color: Colors.error },
});
