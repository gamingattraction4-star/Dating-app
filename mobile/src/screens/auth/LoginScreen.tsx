// SparkMatch — Login Screen
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { bootstrapUser } from '../../services/bootstrap';
import { Config } from '../../config';

export default function LoginScreen({ navigation }: any) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      shake();
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({ emailOrPhone: emailOrPhone.trim(), password });
      await setAuth(response);
      await bootstrapUser();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let message: string;
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
        message = 'Could not reach the server. It may be waking up — please wait a few seconds and try again.';
      } else {
        message = 'Login failed. Please try again.';
      }
      Alert.alert('Sign in', message);
      shake();
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmailOrPhone(Config.demo.email);
    setPassword(Config.demo.password);
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
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
          <Text style={styles.title}>Welcome back 👋</Text>
          <Text style={styles.subtitle}>Sign in to continue finding your spark</Text>
        </View>

        <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email or phone number"
              placeholderTextColor={Colors.dark.textMuted}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.dark.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.dark.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => navigation.navigate('ForgotPassword', { identifier: emailOrPhone.trim() })}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#666', '#555'] : [Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginGradient}
            >
              <Text style={styles.loginText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoButton} onPress={fillDemo} activeOpacity={0.7}>
            <Ionicons name="sparkles-outline" size={16} color={Colors.neon.gold} />
            <Text style={styles.demoText}>Use demo account</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
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
  header: { marginBottom: Spacing['3xl'] },
  title: { ...Typography.h1, color: Colors.white, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.dark.textSecondary },
  form: {},
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    height: 56,
  },
  inputIcon: { marginRight: Spacing.md },
  input: { flex: 1, ...Typography.body, color: Colors.white, height: '100%' },
  forgotButton: { alignSelf: 'flex-end', marginBottom: Spacing.xl },
  forgotText: { ...Typography.bodySmall, color: Colors.primary },
  loginButton: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  loginButtonDisabled: { opacity: 0.6 },
  loginGradient: {
    paddingVertical: Spacing.base, alignItems: 'center',
    borderRadius: BorderRadius.xl,
  },
  loginText: { ...Typography.button, color: Colors.white },
  demoButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: Spacing.lg,
  },
  demoText: { ...Typography.bodySmall, color: Colors.neon.gold },
  signupContainer: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: Spacing['2xl'],
  },
  signupText: { ...Typography.body, color: Colors.dark.textSecondary },
  signupLink: { ...Typography.label, color: Colors.primary },
});
