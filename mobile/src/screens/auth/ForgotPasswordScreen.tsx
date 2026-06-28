// SparkMatch — Forgot / Reset Password
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { authService } from '../../services/authService';

export default function ForgotPasswordScreen({ navigation, route }: any) {
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [identifier, setIdentifier] = useState(route?.params?.identifier || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async () => {
    if (!identifier.trim()) {
      Alert.alert('Required', 'Please enter your email or phone number.');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(identifier.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('RESET');
      Alert.alert('Code Sent', 'We sent a reset code to your email/phone. (Dev: check the backend log.)');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Could not send reset code.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    if (otp.trim().length < 4 || newPassword.length < 8) {
      Alert.alert('Check Details', 'Enter the code and a new password (min 8 characters).');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({
        emailOrPhone: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password reset! Please sign in with your new password.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Could not reset password.';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1a0a2e', '#0F172A']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 'REQUEST' ? 'Reset password 🔑' : 'Enter code 📩'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'REQUEST'
              ? "We'll send a code to verify it's you."
              : `Code sent to ${identifier}. Enter it below with your new password.`}
          </Text>
        </View>

        {step === 'REQUEST' ? (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email or phone number"
                placeholderTextColor={Colors.dark.textMuted}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>
            <PrimaryButton label={loading ? 'Sending...' : 'Send reset code'} onPress={requestReset} disabled={loading} />
          </>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="keypad-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="6-digit code"
                placeholderTextColor={Colors.dark.textMuted}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New password (min 8 chars)"
                placeholderTextColor={Colors.dark.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>
            <PrimaryButton label={loading ? 'Resetting...' : 'Reset password'} onPress={submitReset} disabled={loading} />
            <TouchableOpacity style={styles.resend} onPress={requestReset} disabled={loading}>
              <Text style={styles.resendText}>Didn't get a code? Resend</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity style={[styles.button, disabled && { opacity: 0.6 }]} activeOpacity={0.8} onPress={onPress} disabled={disabled}>
      <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
        <Text style={styles.buttonText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center' },
  backButton: {
    position: 'absolute', top: 60, left: 0,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  header: { marginBottom: Spacing['2xl'] },
  title: { ...Typography.h1, color: Colors.white, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.dark.textSecondary },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', height: 56,
  },
  inputIcon: { marginRight: Spacing.md },
  input: { flex: 1, ...Typography.body, color: Colors.white, height: '100%' },
  button: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.md },
  buttonGradient: { paddingVertical: Spacing.base, alignItems: 'center', borderRadius: BorderRadius.xl },
  buttonText: { ...Typography.button, color: Colors.white },
  resend: { alignSelf: 'center', marginTop: Spacing.xl },
  resendText: { ...Typography.bodySmall, color: Colors.primary },
});
