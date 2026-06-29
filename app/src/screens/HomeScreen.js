import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../theme';

const { width } = Dimensions.get('window');

const FEATURES = [
  { tag: 'TRACKING',  title: 'Effortless Logging',    body: 'Log weight, food, steps and workouts in seconds. Barcode scanner included.' },
  { tag: 'ADAPT',     title: 'TG·Adapt Plans',          body: 'Your plan adjusts weekly based on your actual results — not what should work in theory.' },
  { tag: 'INSIGHT',   title: 'AI Nutrition Coach',     body: 'Chat with an AI that understands your body, your goals, and your food.' },
  { tag: 'VISION',    title: 'Photo Calorie Count',    body: 'Snap a photo of any meal. The AI estimates calories and macros instantly.' },
];

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Nav */}
        <View style={styles.nav}>
          <Text style={styles.logo}>METABOLISM</Text>
          <View style={styles.navRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.navLink}>
              <Text style={styles.navLinkText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.navBtn}>
              <Text style={styles.navBtnText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PERSONAL METABOLIC INTELLIGENCE</Text>
          <View style={styles.goldBar} />
          <Text style={styles.heroTitle}>Become the best{'\n'}version of yourself.</Text>
          <Text style={styles.heroSub}>
            Track what matters. Adapt what doesn't work. Know why.{'\n'}
            A discipline system built for people who are serious about results.
          </Text>
          <View style={styles.heroBtns}>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Begin protocol →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.btnSecondary}>
              <Text style={styles.btnSecondaryText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionEye}>CAPABILITIES</Text>
          <Text style={styles.sectionTitle}>Everything the serious{'\n'}athlete needs.</Text>
          {FEATURES.map(f => (
            <View key={f.tag} style={styles.featureCard}>
              <Text style={styles.featureTag}>{f.tag}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureBody}>{f.body}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Your arc starts today.</Text>
          <Text style={styles.ctaSub}>Free forever. No subscriptions. Just results.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={[styles.btnPrimary, { marginTop: spacing.lg }]}>
            <Text style={styles.btnPrimaryText}>Create your account →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  logo: { fontFamily: fonts.display, color: colors.gold, fontSize: 15, letterSpacing: 3 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  navLink: { paddingHorizontal: spacing.sm },
  navLinkText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  navBtn: { backgroundColor: colors.gold, paddingHorizontal: spacing.md, paddingVertical: 7 },
  navBtnText: { fontFamily: fonts.mono, color: '#080808', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },

  hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  eyebrow: { fontFamily: fonts.mono, color: colors.text3, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: spacing.md },
  goldBar: { width: 40, height: 2, backgroundColor: colors.gold, marginBottom: spacing.lg },
  heroTitle: { fontFamily: fonts.display, color: colors.text, fontSize: 36, lineHeight: 44, letterSpacing: 0.5, marginBottom: spacing.md },
  heroSub: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13, lineHeight: 22, letterSpacing: 0.3, marginBottom: spacing.xl },
  heroBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  btnPrimary: { backgroundColor: colors.gold, paddingVertical: 13, paddingHorizontal: spacing.lg },
  btnPrimaryText: { fontFamily: fonts.mono, color: '#080808', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  btnSecondary: { borderWidth: 1, borderColor: colors.border, paddingVertical: 13, paddingHorizontal: spacing.lg },
  btnSecondaryText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13, letterSpacing: 1 },

  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  sectionEye: { fontFamily: fonts.mono, color: colors.text3, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: spacing.sm },
  sectionTitle: { fontFamily: fonts.display, color: colors.text, fontSize: 26, lineHeight: 34, marginBottom: spacing.lg },

  featureCard: {
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    marginBottom: spacing.md, backgroundColor: colors.surface,
  },
  featureTag: { fontFamily: fonts.mono, color: colors.gold, fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: spacing.xs },
  featureTitle: { fontFamily: fonts.display, color: colors.text, fontSize: 18, marginBottom: spacing.xs },
  featureBody: { fontFamily: fonts.mono, color: colors.text2, fontSize: 12, lineHeight: 20, letterSpacing: 0.3 },

  ctaSection: {
    margin: spacing.lg, padding: spacing.xl, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center',
  },
  ctaTitle: { fontFamily: fonts.display, color: colors.text, fontSize: 24, textAlign: 'center' },
  ctaSub: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13, letterSpacing: 0.3, marginTop: spacing.sm, textAlign: 'center' },
});
