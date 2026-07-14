import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUser, saveUser } from '../services/storage';
import { colors, fonts, spacing, common } from '../theme';

function shake(anim) {
  anim.setValue(0);
  Animated.sequence([
    Animated.timing(anim, { toValue: -8, duration: 60, useNativeDriver: true }),
    Animated.timing(anim, { toValue:  8, duration: 60, useNativeDriver: true }),
    Animated.timing(anim, { toValue: -6, duration: 60, useNativeDriver: true }),
    Animated.timing(anim, { toValue:  6, duration: 60, useNativeDriver: true }),
    Animated.timing(anim, { toValue:  0, duration: 60, useNativeDriver: true }),
  ]).start();
}

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({});
  const [userFocus, setUserFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const shakeUser = useRef(new Animated.Value(0)).current;
  const shakePass = useRef(new Animated.Value(0)).current;

  function clearError(field) {
    setErrors(e => ({ ...e, [field]: null }));
  }

  async function handleLogin() {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Please enter your username.';
    if (!password)        newErrors.password = 'Please enter your password.';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      if (newErrors.username) shake(shakeUser);
      if (newErrors.password) shake(shakePass);
      return;
    }

    // Retrieve stored user and verify
    const stored = await getUser();
    if (!stored || stored.username !== username.trim()) {
      setErrors({ password: 'Incorrect username or password.' });
      shake(shakePass);
      return;
    }
    if (stored.password !== password) {
      setErrors({ password: 'Incorrect username or password.' });
      shake(shakePass);
      return;
    }

    navigation.replace('Dashboard');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={common.goldBar} />
            <Text style={styles.tag}>ENTRY LOG // ACCESS</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.sub}>The body remembers. Sign back in to continue being better.</Text>

            {/* Username */}
            <Animated.View style={[styles.fieldGroup, { transform: [{ translateX: shakeUser }] }]}>
              <Text style={styles.label}>Subject ID</Text>
              <TextInput
                style={[styles.input, userFocus && styles.inputFocus, errors.username && styles.inputError]}
                value={username}
                onChangeText={t => { setUsername(t); clearError('username'); }}
                onFocus={() => setUserFocus(true)}
                onBlur={() => setUserFocus(false)}
                placeholder="USERNAME"
                placeholderTextColor={colors.text3}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.username ? <Text style={styles.errText}>{errors.username}</Text> : null}
            </Animated.View>

            {/* Password */}
            <Animated.View style={[styles.fieldGroup, { transform: [{ translateX: shakePass }] }]}>
              <Text style={styles.label}>Passphrase</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={[styles.input, styles.pwInput, passFocus && styles.inputFocus, errors.password && styles.inputError]}
                  value={password}
                  onChangeText={t => { setPassword(t); clearError('password'); }}
                  onFocus={() => setPassFocus(true)}
                  onBlur={() => setPassFocus(false)}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text3}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showPass ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errText}>{errors.password}</Text> : null}
            </Animated.View>

            <TouchableOpacity onPress={handleLogin} style={styles.submitBtn}>
              <Text style={styles.submitText}>Log in</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.switchRow}>
              <Text style={styles.switchText}>No record on file? </Text>
              <Text style={[styles.switchText, { color: colors.gold }]}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  back: { padding: spacing.lg },
  backText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13, letterSpacing: 0.5 },

  card: {
    marginHorizontal: spacing.lg, marginTop: spacing.xl,
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  tag: { fontFamily: fonts.mono, color: colors.text3, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, color: colors.text, fontSize: 28, marginBottom: spacing.xs },
  sub: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13, lineHeight: 20, letterSpacing: 0.3, marginBottom: spacing.lg, fontStyle: 'italic' },

  fieldGroup: { marginBottom: spacing.md },
  label: { fontFamily: fonts.mono, color: colors.text2, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.xs },
  input: {
    ...common.input,
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
  },
  inputFocus: { borderBottomColor: colors.gold },
  inputError: { borderBottomColor: colors.error },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  pwInput: { flex: 1 },
  eyeBtn: { padding: spacing.xs },
  eyeText: { fontSize: 16 },
  errText: { fontFamily: fonts.mono, color: colors.error, fontSize: 11, marginTop: 5, letterSpacing: 0.3 },

  submitBtn: { ...common.button, marginTop: spacing.lg },
  submitText: { ...common.buttonText, fontFamily: fonts.mono },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  switchText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13 },
});
