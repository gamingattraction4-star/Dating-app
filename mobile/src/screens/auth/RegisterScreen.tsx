// SparkMatch — Register Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { bootstrapUser } from '../../services/bootstrap';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        email: email.trim(), password, displayName: name.trim(),
      });
      await setAuth(response);
      await bootstrapUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('ProfileSetup');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please check your connection.';
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
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account 🚀</Text>
            <Text style={styles.subtitle}>Start your journey to find your perfect match</Text>
          </View>

          {/* Name */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.dark.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.dark.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (min 8 chars)"
              placeholderTextColor={Colors.dark.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.dark.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Password Strength */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={[styles.strengthBar, { backgroundColor: password.length >= 8 ? Colors.success : Colors.error }]} />
              <View style={[styles.strengthBar, { backgroundColor: password.length >= 10 ? Colors.success : Colors.dark.border }]} />
              <View style={[styles.strengthBar, { backgroundColor: /[A-Z]/.test(password) && /[0-9]/.test(password) ? Colors.success : Colors.dark.border }]} />
              <Text style={styles.strengthText}>
                {password.length < 8 ? 'Weak' : password.length < 10 ? 'Medium' : 'Strong'}
              </Text>
            </View>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, loading && { opacity: 0.6 }]}
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerGradient}
            >
              <Text style={styles.registerText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 100, paddingBottom: 40 },
  backButton: {
    position: 'absolute', top: -40,
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
  strengthRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.xl, gap: 4,
  },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { ...Typography.caption, color: Colors.dark.textMuted, marginLeft: Spacing.sm },
  registerButton: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.md },
  registerGradient: {
    paddingVertical: Spacing.base, alignItems: 'center', borderRadius: BorderRadius.xl,
  },
  registerText: { ...Typography.button, color: Colors.white },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  loginText: { ...Typography.body, color: Colors.dark.textSecondary },
  loginLink: { ...Typography.label, color: Colors.primary },
});
