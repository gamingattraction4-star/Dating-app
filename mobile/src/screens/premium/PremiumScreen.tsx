// SparkMatch — Premium / Subscription screen
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../theme';
import { premiumService } from '../../services/premiumService';
import { userService } from '../../services/userService';
import { useAppStore } from '../../store/appStore';
import { SubscriptionPlan } from '../../types';

const PERKS = [
  { icon: 'infinite', label: 'Unlimited likes' },
  { icon: 'star', label: 'See who likes you' },
  { icon: 'arrow-undo', label: 'Rewind your last swipe' },
  { icon: 'flash', label: 'Monthly profile boosts' },
  { icon: 'rocket', label: 'Priority in Discovery' },
];

export default function PremiumScreen({ navigation }: any) {
  const setMyProfile = useAppStore((s) => s.setMyProfile);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    premiumService.getPlans()
      .then((p) => {
        setPlans(p);
        if (p.length) setSelected(p[Math.min(1, p.length - 1)].id); // default to middle/gold
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const price = (cents: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : '';
    return `${symbol}${(cents / 100).toFixed(2)}`;
  };

  const subscribe = async () => {
    if (selected == null) return;
    setSubscribing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await premiumService.subscribe(selected);
      // Refresh local profile so premium-gated features unlock immediately.
      try {
        const fresh = await userService.getMyProfile();
        setMyProfile(fresh);
      } catch { /* ignore */ }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Welcome to Premium! 🎉', 'All premium features are now unlocked.', [
        { text: 'Awesome', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Could not complete subscription.';
      Alert.alert('Subscription', msg);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.close} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="close" size={28} color={Colors.dark.text} />
        </TouchableOpacity>

        <LinearGradient colors={Colors.gradient.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.crest}>
          <Ionicons name="star" size={36} color={Colors.white} />
        </LinearGradient>
        <Text style={styles.title}>SparkMatch Premium</Text>
        <Text style={styles.subtitle}>Get more matches and stand out.</Text>

        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.label} style={styles.perkRow}>
              <View style={styles.perkIcon}>
                <Ionicons name={p.icon as any} size={18} color={Colors.neon.gold} />
              </View>
              <Text style={styles.perkText}>{p.label}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : (
          <View style={styles.plans}>
            {plans.map((plan) => {
              const on = selected === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.plan, on && styles.planOn]}
                  onPress={() => { Haptics.selectionAsync(); setSelected(plan.id); }}
                  activeOpacity={0.85}
                >
                  <View style={styles.planLeft}>
                    <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? Colors.primary : Colors.dark.textMuted} />
                    <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {!!plan.description && <Text style={styles.planDesc} numberOfLines={2}>{plan.description}</Text>}
                    </View>
                  </View>
                  <View style={styles.planPriceWrap}>
                    <Text style={styles.planPrice}>{price(plan.priceCents, plan.currency)}</Text>
                    <Text style={styles.planDuration}>/{plan.durationDays}d</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={[styles.cta, (subscribing || selected == null) && { opacity: 0.6 }]} onPress={subscribe} disabled={subscribing || selected == null} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
            {subscribing ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.ctaText}>Continue</Text>}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.fineprint}>Demo checkout — no real payment is processed.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  content: { padding: Spacing.xl, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  close: { alignSelf: 'flex-start', marginBottom: Spacing.md },
  crest: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', ...Shadow.lg },
  title: { ...Typography.h1, color: Colors.dark.text, marginTop: Spacing.lg },
  subtitle: { ...Typography.body, color: Colors.dark.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.xl },
  perks: { alignSelf: 'stretch', marginBottom: Spacing.xl },
  perkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  perkIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(251,191,36,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  perkText: { ...Typography.body, color: Colors.dark.text },
  plans: { alignSelf: 'stretch', gap: Spacing.md, marginBottom: Spacing.xl },
  plan: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.dark.bgSecondary, borderRadius: BorderRadius.xl, padding: Spacing.base,
    borderWidth: 1.5, borderColor: Colors.dark.border,
  },
  planOn: { borderColor: Colors.primary, backgroundColor: 'rgba(255,77,103,0.08)' },
  planLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.md },
  planName: { ...Typography.label, color: Colors.dark.text },
  planDesc: { ...Typography.caption, color: Colors.dark.textMuted, marginTop: 2 },
  planPriceWrap: { flexDirection: 'row', alignItems: 'flex-end' },
  planPrice: { ...Typography.h3, color: Colors.dark.text },
  planDuration: { ...Typography.caption, color: Colors.dark.textMuted, marginBottom: 3 },
  cta: { alignSelf: 'stretch', borderRadius: BorderRadius.xl, overflow: 'hidden' },
  ctaGradient: { paddingVertical: Spacing.base, alignItems: 'center', borderRadius: BorderRadius.xl },
  ctaText: { ...Typography.button, color: Colors.white },
  fineprint: { ...Typography.caption, color: Colors.dark.textMuted, marginTop: Spacing.md, textAlign: 'center' },
});
