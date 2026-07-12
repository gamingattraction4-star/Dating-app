// SparkMatch — OTP verification (signup + login), modern 6-box UI
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform as RNPlatform } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { bootstrapUser } from '../../services/bootstrap';

const LEN = 6;

export default function OtpScreen({ navigation, route }: any) {
  const mode: 'REGISTER' | 'LOGIN' = route?.params?.mode || 'LOGIN';
  const emailOrPhone: string = route?.params?.emailOrPhone || '';
  const email: string = route?.params?.email || emailOrPhone;

  const setAuth = useAuthStore((s) => s.setAuth);
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const onChange = (text: string, i: number) => {
    // Support paste of the whole code.
    if (text.length > 1) {
      const arr = text.replace(/\D/g, '').slice(0, LEN).split('');
      const next = Array(LEN).fill('').map((_, idx) => arr[idx] || '');
      setDigits(next);
      inputs.current[Math.min(arr.length, LEN - 1)]?.focus();
      if (arr.length >= LEN) submit(next.join(''));
      return;
    }
    const d = text.replace(/\D/g, '');
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < LEN - 1) inputs.current[i + 1]?.focus();
    if (next.every((x) => x) && next.join('').length === LEN) submit(next.join(''));
  };

  const onKeyPress = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const deviceLabel = () => {
    const os = RNPlatform.OS === 'ios' ? 'iPhone' : RNPlatform.OS === 'android' ? 'Android' : 'Web';
    return `${os} device`;
  };

  const submit = async (code: string) => {
    if (code.length !== LEN || loading) return;
    setLoading(true);
    try {
      const res = mode === 'REGISTER'
        ? await authService.verifyRegistration(email, code)
        : await authService.verifyLogin(emailOrPhone, code, deviceLabel());
      if (!res.accessToken) throw new Error('No token returned');
      await setAuth(res);
      await bootstrapUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (mode === 'REGISTER') navigation.navigate('ProfileSetup');
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDigits(Array(LEN).fill(''));
      inputs.current[0]?.focus();
      Alert.alert('Invalid code', e?.response?.data?.message || 'The code is incorrect or expired. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (seconds > 0) return;
    try {
      // Re-trigger by hitting the OTP send endpoint.
      await authService.sendOtp(email, mode === 'REGISTER' ? 'REGISTRATION' : 'LOGIN');
      setSeconds(45);
      Alert.alert('Code sent', `A new code has been sent to ${email}.`);
    } catch {
      Alert.alert('Error', 'Could not resend the code. Try again in a moment.');
    }
  };

  return (
    <LinearGradient colors={['#1a0a2e', '#0F172A']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.iconCircle}>
            <Ionicons name="mail-open" size={30} color={Colors.white} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Enter the code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}<Text style={styles.email}>{email}</Text>
        </Text>

        <View style={styles.boxes}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.box, d ? styles.boxFilled : null]}
              value={d}
              onChangeText={(text) => onChange(text, i)}
              onKeyPress={(e) => onKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={LEN}
              autoFocus={i === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />}

        <TouchableOpacity style={styles.verifyBtn} onPress={() => submit(digits.join(''))} disabled={loading} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verifyGradient}>
            <Text style={styles.verifyText}>Verify</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={resend} disabled={seconds > 0} style={styles.resend}>
          <Text style={[styles.resendText, seconds > 0 && { color: Colors.dark.textMuted }]}>
            {seconds > 0 ? `Resend code in ${seconds}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 56, left: 0, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  iconWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  iconCircle: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title: { ...Typography.h1, color: Colors.white, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.dark.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'] },
  email: { color: Colors.primary, fontWeight: '700' },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  box: {
    width: 48, height: 58, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', color: Colors.white,
    fontSize: 26, fontWeight: '800', textAlign: 'center',
  },
  boxFilled: { borderColor: Colors.primary, backgroundColor: 'rgba(255,77,103,0.12)' },
  verifyBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.sm },
  verifyGradient: { paddingVertical: Spacing.base, alignItems: 'center', borderRadius: BorderRadius.xl },
  verifyText: { ...Typography.button, color: Colors.white },
  resend: { alignSelf: 'center', marginTop: Spacing.xl },
  resendText: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
});
