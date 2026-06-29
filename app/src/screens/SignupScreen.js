import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveUser } from '../services/storage';
import { colors, fonts, spacing, common } from '../theme';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

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

function Field({ label, error, shakeAnim, optional, children }) {
  return (
    <Animated.View style={[styles.fieldGroup, { transform: [{ translateX: shakeAnim || new Animated.Value(0) }] }]}>
      <Text style={styles.label}>{label}{optional ? <Text style={{ color: colors.text3 }}> (optional)</Text> : null}</Text>
      {children}
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </Animated.View>
  );
}

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    fullName: '', age: '', gender: '', weightKg: '', heightCm: '',
    username: '', password: '', confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [focus, setFocus]       = useState({});

  const shakes = {
    age: useRef(new Animated.Value(0)).current,
    gender: useRef(new Animated.Value(0)).current,
    weightKg: useRef(new Animated.Value(0)).current,
    heightCm: useRef(new Animated.Value(0)).current,
    username: useRef(new Animated.Value(0)).current,
    password: useRef(new Animated.Value(0)).current,
    confirm:  useRef(new Animated.Value(0)).current,
  };

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: null }));
  }

  function focusStyle(field) {
    return focus[field] ? styles.inputFocus : null;
  }

  async function handleSignup() {
    const e = {};

    const age = parseInt(form.age);
    if (!form.age) e.age = 'Please enter your age.';
    else if (isNaN(age) || age < 13 || age > 120) e.age = 'Enter a valid age between 13 and 120.';

    if (!form.gender) e.gender = 'Please select your sex.';

    const wt = parseFloat(form.weightKg);
    if (!form.weightKg) e.weightKg = 'Please enter your weight.';
    else if (isNaN(wt) || wt < 20 || wt > 500) e.weightKg = 'Enter a valid weight between 20–500 kg.';

    if (form.heightCm) {
      const ht = parseFloat(form.heightCm);
      if (isNaN(ht) || ht < 50 || ht > 250) e.heightCm = 'Enter a valid height between 50–250 cm.';
    }

    const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
    if (!form.username.trim()) e.username = 'Username is required.';
    else if (form.username.length < 3) e.username = 'Username must be at least 3 characters.';
    else if (form.username.length > 20) e.username = 'Username cannot exceed 20 characters.';
    else if (!USERNAME_RE.test(form.username)) e.username = 'Only letters, numbers, and underscores — no spaces.';

    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';

    if (!form.confirm) e.confirm = 'Please confirm your password.';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';

    if (Object.keys(e).length) {
      setErrors(e);
      Object.entries(e).forEach(([field]) => {
        if (shakes[field]) shake(shakes[field]);
      });
      return;
    }

    const user = {
      username:  form.username.trim(),
      password:  form.password,
      fullName:  form.fullName.trim(),
      age:       age,
      gender:    form.gender,
      weightKg:  wt,
      heightCm:  form.heightCm ? parseFloat(form.heightCm) : null,
      createdAt: new Date().toISOString(),
    };

    await saveUser(user);
    navigation.replace('Dashboard');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <View style={common.goldBar} />
            <Text style={styles.tag}>NEW SPECIMEN // INTAKE</Text>
            <Text style={styles.title}>Begin your arc</Text>
            <Text style={styles.sub}>Tell us a little about yourself so we can personalise your plan.</Text>

            {/* ── About you ── */}
            <Text style={styles.sectionLabel}>About you</Text>

            <Field label="Full name" optional shakeAnim={shakes.fullName}>
              <TextInput
                style={[styles.input, focusStyle('fullName')]}
                value={form.fullName}
                onChangeText={t => set('fullName', t)}
                onFocus={() => setFocus(f => ({ ...f, fullName: true }))}
                onBlur={() => setFocus(f => ({ ...f, fullName: false }))}
                placeholder="e.g. Saksham"
                placeholderTextColor={colors.text3}
                autoCapitalize="words"
              />
            </Field>

            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="Age" error={errors.age} shakeAnim={shakes.age}>
                  <View style={styles.unitWrap}>
                    <TextInput
                      style={[styles.input, styles.unitInput, focusStyle('age'), errors.age && styles.inputError]}
                      value={form.age}
                      onChangeText={t => set('age', t)}
                      onFocus={() => setFocus(f => ({ ...f, age: true }))}
                      onBlur={() => setFocus(f => ({ ...f, age: false }))}
                      placeholder="25"
                      placeholderTextColor={colors.text3}
                      keyboardType="number-pad"
                    />
                    <Text style={styles.unit}>yrs</Text>
                  </View>
                </Field>
              </View>

              <View style={styles.half}>
                <Field label="Sex" error={errors.gender} shakeAnim={shakes.gender}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    <View style={styles.pillRow}>
                      {GENDERS.map(g => (
                        <TouchableOpacity
                          key={g}
                          onPress={() => { set('gender', g); }}
                          style={[styles.pill, form.gender === g && styles.pillActive]}
                        >
                          <Text style={[styles.pillText, form.gender === g && styles.pillTextActive]}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  {errors.gender ? <Text style={styles.errText}>{errors.gender}</Text> : null}
                </Field>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Field label="Weight" error={errors.weightKg} shakeAnim={shakes.weightKg}>
                  <View style={styles.unitWrap}>
                    <TextInput
                      style={[styles.input, styles.unitInput, focusStyle('weightKg'), errors.weightKg && styles.inputError]}
                      value={form.weightKg}
                      onChangeText={t => set('weightKg', t)}
                      onFocus={() => setFocus(f => ({ ...f, weightKg: true }))}
                      onBlur={() => setFocus(f => ({ ...f, weightKg: false }))}
                      placeholder="70"
                      placeholderTextColor={colors.text3}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.unit}>kg</Text>
                  </View>
                </Field>
              </View>

              <View style={styles.half}>
                <Field label="Height" optional error={errors.heightCm} shakeAnim={shakes.heightCm}>
                  <View style={styles.unitWrap}>
                    <TextInput
                      style={[styles.input, styles.unitInput, focusStyle('heightCm'), errors.heightCm && styles.inputError]}
                      value={form.heightCm}
                      onChangeText={t => set('heightCm', t)}
                      onFocus={() => setFocus(f => ({ ...f, heightCm: true }))}
                      onBlur={() => setFocus(f => ({ ...f, heightCm: false }))}
                      placeholder="170"
                      placeholderTextColor={colors.text3}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.unit}>cm</Text>
                  </View>
                </Field>
              </View>
            </View>

            {/* ── Account ── */}
            <Text style={styles.sectionLabel}>Your account</Text>

            <Field label="Username" error={errors.username} shakeAnim={shakes.username}>
              <TextInput
                style={[styles.input, focusStyle('username'), errors.username && styles.inputError]}
                value={form.username}
                onChangeText={t => set('username', t)}
                onFocus={() => setFocus(f => ({ ...f, username: true }))}
                onBlur={() => setFocus(f => ({ ...f, username: false }))}
                placeholder="choose a username"
                placeholderTextColor={colors.text3}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>3–20 chars · letters, numbers, underscore only</Text>
            </Field>

            <Field label="Passphrase" error={errors.password} shakeAnim={shakes.password}>
              <View style={styles.pwRow}>
                <TextInput
                  style={[styles.input, styles.pwInput, focusStyle('password'), errors.password && styles.inputError]}
                  value={form.password}
                  onChangeText={t => set('password', t)}
                  onFocus={() => setFocus(f => ({ ...f, password: true }))}
                  onBlur={() => setFocus(f => ({ ...f, password: false }))}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text3}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showPass ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Minimum 8 characters</Text>
            </Field>

            <Field label="Confirm passphrase" error={errors.confirm} shakeAnim={shakes.confirm}>
              <View style={styles.pwRow}>
                <TextInput
                  style={[styles.input, styles.pwInput, focusStyle('confirm'), errors.confirm && styles.inputError]}
                  value={form.confirm}
                  onChangeText={t => set('confirm', t)}
                  onFocus={() => setFocus(f => ({ ...f, confirm: true }))}
                  onBlur={() => setFocus(f => ({ ...f, confirm: false }))}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text3}
                  secureTextEntry={!showConf}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConf(s => !s)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showConf ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </Field>

            <TouchableOpacity onPress={handleSignup} style={[common.button, { marginTop: spacing.lg }]}>
              <Text style={[common.buttonText, { fontFamily: fonts.mono }]}>Create account</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account? </Text>
              <Text style={[styles.switchText, { color: colors.gold }]}>Log in</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: spacing.xxl }} />
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
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg,
  },
  tag:   { fontFamily: fonts.mono, color: colors.text3, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: spacing.xs },
  title: { fontFamily: fonts.display, color: colors.text, fontSize: 28, marginBottom: spacing.xs },
  sub:   { fontFamily: fonts.mono, color: colors.text2, fontSize: 13, lineHeight: 20, letterSpacing: 0.3, marginBottom: spacing.lg, fontStyle: 'italic' },

  sectionLabel: {
    fontFamily: fonts.mono, color: colors.text3, fontSize: 9, letterSpacing: 3,
    textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.xs,
  },

  row:  { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },

  fieldGroup: { marginBottom: spacing.md },
  label: { fontFamily: fonts.mono, color: colors.text2, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  input: { ...common.input, fontFamily: fonts.mono },
  inputFocus: { borderBottomColor: colors.gold },
  inputError: { borderBottomColor: colors.error },
  hint: { fontFamily: fonts.mono, color: colors.text3, fontSize: 10, marginTop: 4, letterSpacing: 0.3 },
  errText: { fontFamily: fonts.mono, color: colors.error, fontSize: 11, marginTop: 5 },

  unitWrap: { flexDirection: 'row', alignItems: 'center' },
  unitInput: { flex: 1 },
  unit: { fontFamily: fonts.mono, color: colors.text3, fontSize: 11, marginLeft: spacing.xs },

  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  pill: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 5 },
  pillActive: { borderColor: colors.gold, backgroundColor: 'rgba(201,168,76,0.1)' },
  pillText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 10, letterSpacing: 0.5 },
  pillTextActive: { color: colors.gold },

  pwRow: { flexDirection: 'row', alignItems: 'center' },
  pwInput: { flex: 1 },
  eyeBtn: { padding: spacing.xs },
  eyeText: { fontSize: 16 },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  switchText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13 },
});
