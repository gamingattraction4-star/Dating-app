// SparkMatch — Welcome Screen (Onboarding)
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const comingSoon = (provider: string) =>
  Alert.alert(`${provider} Sign-In`, 'Social sign-in is coming soon. Please use email for now.');

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const heartBeat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Heart pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(heartBeat, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(heartBeat, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <LinearGradient
      colors={['#1a0a2e', '#16213e', '#0F172A']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Floating Gradient Orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['rgba(255,77,103,0.3)', 'rgba(168,85,247,0.1)']}
          style={[styles.orb, styles.orb1]}
        />
        <LinearGradient
          colors={['rgba(168,85,247,0.3)', 'rgba(59,130,246,0.1)']}
          style={[styles.orb, styles.orb2]}
        />
        <LinearGradient
          colors={['rgba(255,77,103,0.2)', 'rgba(249,115,22,0.1)']}
          style={[styles.orb, styles.orb3]}
        />
      </View>

      {/* Logo Section */}
      <Animated.View
        style={[
          styles.logoSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View style={[styles.logoCircle, { transform: [{ scale: heartBeat }] }]}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Ionicons name="flame" size={48} color={Colors.white} />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.appName}>SparkMatch</Text>
        <Text style={styles.tagline}>Where Connections Ignite ✨</Text>
      </Animated.View>

      {/* Features */}
      <Animated.View
        style={[
          styles.featuresSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.featureRow}>
          <View style={styles.featureDot}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.neon.green} />
          </View>
          <Text style={styles.featureText}>Verified profiles, real connections</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureDot}>
            <Ionicons name="sparkles" size={20} color={Colors.neon.gold} />
          </View>
          <Text style={styles.featureText}>AI-powered smart matching</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureDot}>
            <Ionicons name="location" size={20} color={Colors.neon.blue} />
          </View>
          <Text style={styles.featureText}>Meet people near you</Text>
        </View>
      </Animated.View>

      {/* Buttons */}
      <Animated.View
        style={[
          styles.buttonSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Register')}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>Already have an account? Sign in</Text>
        </TouchableOpacity>

        {/* Social Login */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.7} onPress={() => comingSoon('Google')}>
            <Ionicons name="logo-google" size={22} color={Colors.google} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialButton, { marginLeft: Spacing.md }]} activeOpacity={0.7} onPress={() => comingSoon('Apple')}>
            <Ionicons name="logo-apple" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.linkText}>Terms</Text> &{' '}
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -50,
    right: -100,
  },
  orb2: {
    width: 250,
    height: 250,
    bottom: 100,
    left: -80,
  },
  orb3: {
    width: 200,
    height: 200,
    top: height * 0.35,
    right: -50,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoCircle: {
    marginBottom: Spacing.lg,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  featuresSection: {
    marginBottom: Spacing['3xl'],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  buttonSection: {
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  buttonGradient: {
    paddingVertical: Spacing.base,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  secondaryButtonText: {
    ...Typography.body,
    color: Colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    marginHorizontal: Spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  termsText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
