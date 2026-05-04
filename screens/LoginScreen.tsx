import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, Easing, KeyboardAvoidingView, Platform, Alert,
  Dimensions, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const C = {
  bg: '#07070e', card: '#0f0f1a', cardBorder: '#1a1a2e',
  primary: '#e53935', primaryDark: '#b71c1c',
  primaryGlow: 'rgba(229,57,53,0.25)', accent: '#ef5350',
  green: '#00e676', text: '#ffffff', textSub: '#8888aa', textMuted: '#44445a',
};

export default function LoginScreen({ onLogin, onGoRegister }: { onLogin: (email: string) => void; onGoRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(formOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    onLogin(email.trim());
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={s.logoArea}>
          <Animated.View style={[s.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[s.logoCircle, { transform: [{ scale: logoScale }] }]}>
            <Ionicons name="shield-checkmark" size={48} color={C.primary} />
          </Animated.View>
          <Text style={s.brand}>ResqLink</Text>
          <Text style={s.tagline}>Emergency Response Network</Text>
        </View>

        {/* Form */}
        <Animated.View style={[s.form, { opacity: formOpacity }]}>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>Sign in to access emergency services</Text>

          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={C.textSub} style={s.inputIcon} />
            <TextInput style={s.input} placeholder="Email address" placeholderTextColor={C.textMuted}
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={C.textSub} style={s.inputIcon} />
            <TextInput style={s.input} placeholder="Password" placeholderTextColor={C.textMuted}
              value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textSub} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.forgotBtn}>
            <Text style={s.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.loginBtn} activeOpacity={0.85} onPress={handleLogin}>
            <Text style={s.loginBtnText}>SIGN IN</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} /><Text style={s.dividerText}>OR</Text><View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.registerBtn} onPress={onGoRegister}>
            <Text style={s.registerText}>Don't have an account? <Text style={s.registerLink}>Register</Text></Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={s.footer}>ResqLink v1.0.0 · Your Safety, Our Priority</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 },
  logoArea: { alignItems: 'center', marginBottom: 36 },
  pulseRing: { position: 'absolute', top: 0, width: 110, height: 110, borderRadius: 55, backgroundColor: C.primaryGlow },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: C.card,
    borderWidth: 2, borderColor: C.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 15,
  },
  brand: { fontSize: 32, fontWeight: '900', color: C.text, marginTop: 16, letterSpacing: 1 },
  tagline: { fontSize: 13, color: C.textSub, marginTop: 4, letterSpacing: 0.5 },
  form: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C.textSub, marginBottom: 24 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 14, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 16 },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: C.primary, fontSize: 13, fontWeight: '600' },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.cardBorder },
  dividerText: { color: C.textMuted, fontSize: 12, fontWeight: '700', marginHorizontal: 12 },
  registerBtn: { alignItems: 'center' },
  registerText: { color: C.textSub, fontSize: 14 },
  registerLink: { color: C.primary, fontWeight: '700' },
  footer: { textAlign: 'center', color: C.textMuted, fontSize: 11, marginTop: 24 },
});
