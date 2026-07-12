// SparkMatch — Help & Support
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useTheme, ActiveTheme, Colors } from '../../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  { q: 'How does matching work?', a: 'Swipe right (or tap the heart) on people you like and left (or the ✕) on those you don\'t. When two people like each other, it\'s a match and you can start chatting. Use Super Like to stand out.' },
  { q: 'How do I get more matches?', a: 'Add at least 3 clear photos, write a genuine bio, and fill in your interests and lifestyle details. Profiles that are complete get up to 3x more matches. Keep your location on so nearby people can find you.' },
  { q: 'Why am I not seeing anyone in Discover?', a: 'Make sure location is enabled and widen your filters (age range, distance, or turn on Global Mode). If you\'ve swiped through everyone nearby, check back later as new people join.' },
  { q: 'Is SparkMatch free?', a: 'Yes! SparkMatch is completely free. Swiping, matching, messaging, seeing who likes you, rewind and boost are all included at no cost.' },
  { q: 'How do I edit my profile?', a: 'Go to the Profile tab and tap "Edit Profile". You can update photos, bio, job, interests, and lifestyle details like height, workout, pets and more.' },
  { q: 'How do I stay safe?', a: 'Never share financial information. Meet in public places for first dates and tell a friend your plans. You can block or report anyone who makes you uncomfortable from their profile or chat.' },
  { q: 'How do I block or report someone?', a: 'Open a chat or profile, tap the options menu, and choose Block or Report. Blocked users can no longer see you or message you.' },
  { q: 'How do I delete my account?', a: 'Go to Settings and tap "Delete account" at the bottom. This permanently removes your profile, matches and messages.' },
];

export default function HelpScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [open, setOpen] = useState<number | null>(0);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(open === i ? null : i);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="help-buoy" size={26} color={Colors.white} /></View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Find answers below, or reach out to our team any time.</Text>
        </View>

        <Text style={styles.section}>Frequently asked</Text>
        {FAQS.map((f, i) => (
          <TouchableOpacity key={i} style={styles.faq} activeOpacity={0.8} onPress={() => toggle(i)}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ}>{f.q}</Text>
              <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={t.textMuted} />
            </View>
            {open === i && <Text style={styles.faqA}>{f.a}</Text>}
          </TouchableOpacity>
        ))}

        <Text style={styles.section}>Still need help?</Text>
        <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@sparkmatch.com')}>
          <View style={[styles.contactIcon, { backgroundColor: 'rgba(255,77,103,0.15)' }]}><Ionicons name="mail" size={18} color={Colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Email support</Text>
            <Text style={styles.contactValue}>support@sparkmatch.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={t.textMuted} />
        </TouchableOpacity>

        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.neon.green} />
          <Text style={styles.safetyText}>Your safety matters. Meet in public, trust your instincts, and report anything that feels off.</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  hero: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  heroTitle: { ...Typography.h2, color: t.text },
  heroSub: { ...Typography.body, color: t.textSecondary, textAlign: 'center', marginTop: 4 },
  section: { ...Typography.label, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.xl, marginBottom: Spacing.md },
  faq: { backgroundColor: t.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { ...Typography.label, color: t.text, flex: 1, marginRight: Spacing.md },
  faqA: { ...Typography.body, color: t.textSecondary, marginTop: Spacing.sm, lineHeight: 21 },
  contactRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  contactIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  contactLabel: { ...Typography.label, color: t.text },
  contactValue: { ...Typography.caption, color: t.textMuted, marginTop: 1 },
  safetyCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: BorderRadius.lg, padding: Spacing.base, marginTop: Spacing.lg },
  safetyText: { ...Typography.bodySmall, color: t.textSecondary, flex: 1, lineHeight: 20 },
});
