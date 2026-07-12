// SparkMatch — Privacy Policy
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { Typography, Spacing, useTheme, ActiveTheme, Colors } from '../../theme';

const SECTIONS: { h: string; b: string }[] = [
  { h: '1. Information we collect', b: 'When you create an account we collect your name, email, date of birth, gender, photos, bio, interests and the lifestyle details you choose to add. With your permission we also collect your approximate location to show you people nearby.' },
  { h: '2. How we use your information', b: 'We use your information to create your profile, suggest matches, enable messaging, keep the community safe, and improve the app. We never sell your personal data to third parties.' },
  { h: '3. What others can see', b: 'Your profile (name, age, photos, bio, interests and distance) is visible to other members in Discover and People. Your exact location, email and phone number are never shown to other users.' },
  { h: '4. Messages & activity', b: 'Your messages are stored securely so conversations sync across your devices. We may review reported content to enforce our community guidelines.' },
  { h: '5. Location', b: 'Location is used only to calculate distance and show nearby people. You can turn it off any time in your device settings; distance-based discovery may stop working if you do.' },
  { h: '6. Data security', b: 'Passwords are stored using strong one-way encryption (bcrypt) and are never readable, even by us. Connections to our servers are encrypted. Sign-ins are protected with email verification codes.' },
  { h: '7. Your choices & rights', b: 'You can edit or delete your profile information at any time. You may request account deletion from Settings, which permanently removes your profile, matches and messages.' },
  { h: '8. Age requirement', b: 'SparkMatch is only for people aged 18 and older. Accounts found to belong to minors are removed.' },
  { h: '9. Changes to this policy', b: 'We may update this policy as the app evolves. Significant changes will be communicated in the app.' },
  { h: '10. Contact us', b: 'Questions about your privacy? Email us at privacy@sparkmatch.com and we\'ll be happy to help.' },
];

export default function PrivacyScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.container}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: July 2026</Text>
        <Text style={styles.intro}>
          Your privacy is important to us. This policy explains what we collect, how we use it, and the choices you have. By using SparkMatch you agree to these practices.
        </Text>
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.block}>
            <Text style={styles.h}>{s.h}</Text>
            <Text style={styles.b}>{s.b}</Text>
          </View>
        ))}
        <Text style={styles.footer}>© 2026 SparkMatch. Made with ♥</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  title: { ...Typography.h1, color: t.text },
  updated: { ...Typography.caption, color: t.textMuted, marginTop: 4, marginBottom: Spacing.lg },
  intro: { ...Typography.body, color: t.textSecondary, lineHeight: 22, marginBottom: Spacing.lg },
  block: { marginBottom: Spacing.lg },
  h: { ...Typography.label, color: t.text, marginBottom: 6 },
  b: { ...Typography.body, color: t.textSecondary, lineHeight: 22 },
  footer: { ...Typography.caption, color: t.textMuted, textAlign: 'center', marginTop: Spacing.lg },
});
