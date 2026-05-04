import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg: '#07070e', card: '#0f0f1a', cardBorder: '#1a1a2e',
  primary: '#e53935', primaryGlow: 'rgba(229,57,53,0.25)',
  text: '#ffffff', textSub: '#8888aa', textMuted: '#44445a',
};

export default function RegisterScreen({ onRegister, onGoLogin }: { onRegister: (name: string, email: string) => void; onGoLogin: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.'); return;
    }
    if (password !== confirm) {
      Alert.alert('Password Mismatch', 'Passwords do not match.'); return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.'); return;
    }
    Alert.alert('✅ Account Created!', `Welcome aboard, ${name.trim()}!`, [
      { text: 'Continue', onPress: () => onRegister(name.trim(), email.trim()) },
    ]);
  };

  const fields = [
    { icon: 'person-outline' as const, placeholder: 'Full Name', value: name, set: setName, secure: false },
    { icon: 'mail-outline' as const, placeholder: 'Email address', value: email, set: setEmail, secure: false, kb: 'email-address' as const },
    { icon: 'lock-closed-outline' as const, placeholder: 'Password', value: password, set: setPassword, secure: true },
    { icon: 'shield-checkmark-outline' as const, placeholder: 'Confirm Password', value: confirm, set: setConfirm, secure: true },
  ];

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeIn }}>
          {/* Header */}
          <TouchableOpacity style={s.backBtn} onPress={onGoLogin}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>

          <View style={s.headerArea}>
            <View style={s.iconCircle}>
              <Ionicons name="person-add" size={32} color={C.primary} />
            </View>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>Join the emergency response network</Text>
          </View>

          {/* Fields */}
          {fields.map((f, i) => (
            <View key={i} style={s.inputWrap}>
              <Ionicons name={f.icon} size={18} color={C.textSub} style={s.inputIcon} />
              <TextInput
                style={s.input} placeholder={f.placeholder} placeholderTextColor={C.textMuted}
                value={f.value} onChangeText={f.set}
                secureTextEntry={f.secure && !showPass}
                keyboardType={f.kb || 'default'} autoCapitalize={f.kb ? 'none' : 'words'}
              />
              {f.secure && i === 2 && (
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textSub} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Terms */}
          <Text style={s.terms}>
            By creating an account, you agree to our{' '}
            <Text style={s.termsLink}>Terms of Service</Text> and{' '}
            <Text style={s.termsLink}>Privacy Policy</Text>
          </Text>

          <TouchableOpacity style={s.registerBtn} activeOpacity={0.85} onPress={handleRegister}>
            <Text style={s.registerBtnText}>CREATE ACCOUNT</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={s.loginLink} onPress={onGoLogin}>
            <Text style={s.loginText}>Already have an account? <Text style={s.loginHighlight}>Sign In</Text></Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  headerArea: { alignItems: 'center', marginBottom: 30 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryGlow, borderWidth: 2, borderColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C.textSub },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 14, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 16 },
  eyeBtn: { padding: 4 },
  terms: { color: C.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 20, marginTop: 4 },
  termsLink: { color: C.primary, fontWeight: '600' },
  registerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginText: { color: C.textSub, fontSize: 14 },
  loginHighlight: { color: C.primary, fontWeight: '700' },
});
