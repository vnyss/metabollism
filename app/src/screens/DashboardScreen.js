import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Modal, Alert, Dimensions, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Polyline, Line, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { getUser, clearUser, getDailyLogs, saveDailyLog, getTodayLog, getUserPlan } from '../services/storage';
import { fetchWeather, lookupBarcode, wxLookup } from '../services/api';
import { colors, fonts, spacing } from '../theme';

const { width } = Dimensions.get('window');
const CHART_W = width - spacing.lg * 2 - 32;

// ─── Weather icon (SVG, mini) ─────────────────────────────────────────────────
function WeatherIcon({ code }) {
  const RAIN    = [51,53,55,56,57,61,63,65,66,67,80,81,82];
  const SNOW    = [71,73,75,77,85,86];
  const THUNDER = [95,96,99];
  const FOG     = [45,48];
  const CLEAR   = [0,1];

  if (CLEAR.includes(code)) return (
    <Svg viewBox="0 0 44 44" width={40} height={40}>
      <Circle cx={22} cy={22} r={8} fill="#C9A84C" opacity={0.9} />
      <Line x1={22} y1={2}  x2={22} y2={9}  stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={22} y1={35} x2={22} y2={42} stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={2}  y1={22} x2={9}  y2={22} stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={35} y1={22} x2={42} y2={22} stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={7}  y1={7}  x2={12} y2={12} stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={32} y1={32} x2={37} y2={37} stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={37} y1={7}  x2={32} y2={12} stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={12} y1={32} x2={7}  y2={37} stroke="#C9A84C" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );

  if (THUNDER.includes(code)) return (
    <Svg viewBox="0 0 44 44" width={40} height={40}>
      <Polyline points="4,22 3,14 11,11 13,4 22,5 31,4 34,11 41,11 41,18 4,24" fill="rgba(70,80,100,0.35)" stroke="rgba(150,165,185,0.6)" strokeWidth={1.2} />
      <Polyline points="24,26 19,35 23,35 17,44" fill="none" stroke="#C9A84C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );

  if (SNOW.includes(code)) return (
    <Svg viewBox="0 0 44 44" width={40} height={40}>
      <Polyline points="5,24 4,17 11,14 13,7 22,8 31,7 33,14 40,14 40,21 5,26" fill="rgba(120,150,180,0.2)" stroke="rgba(180,200,220,0.5)" strokeWidth={1.2} />
      <Circle cx={14} cy={35} r={2.2} fill="rgba(220,235,255,0.9)" />
      <Circle cx={22} cy={33} r={2.2} fill="rgba(220,235,255,0.9)" />
      <Circle cx={31} cy={35} r={2.2} fill="rgba(220,235,255,0.9)" />
    </Svg>
  );

  if (RAIN.includes(code)) return (
    <Svg viewBox="0 0 44 44" width={40} height={40}>
      <Polyline points="5,24 4,17 11,14 13,7 22,8 31,7 33,14 40,14 40,21 5,26" fill="rgba(100,130,160,0.2)" stroke="rgba(170,195,220,0.5)" strokeWidth={1.2} />
      <Line x1={14} y1={30} x2={12} y2={40} stroke="rgba(140,195,240,0.8)" strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={22} y1={30} x2={20} y2={41} stroke="rgba(140,195,240,0.8)" strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={31} y1={30} x2={29} y2={40} stroke="rgba(140,195,240,0.8)" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );

  if (FOG.includes(code)) return (
    <Svg viewBox="0 0 44 44" width={40} height={40}>
      <Line x1={4}  y1={16} x2={40} y2={16} stroke="rgba(200,210,220,0.5)"  strokeWidth={2} strokeLinecap="round" />
      <Line x1={8}  y1={23} x2={36} y2={23} stroke="rgba(200,210,220,0.65)" strokeWidth={2} strokeLinecap="round" />
      <Line x1={4}  y1={30} x2={40} y2={30} stroke="rgba(200,210,220,0.5)"  strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );

  // Cloud / overcast
  return (
    <Svg viewBox="0 0 44 44" width={40} height={40}>
      <Polyline points="5,30 4,22 11,19 13,11 22,12 31,11 33,19 40,19 40,26 5,32" fill="rgba(140,160,180,0.2)" stroke="rgba(200,210,220,0.55)" strokeWidth={1.2} />
    </Svg>
  );
}

// ─── Sparkline chart ──────────────────────────────────────────────────────────
function SparkLine({ data, label }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const H = 50, W = CHART_W;
  const px = (i) => (i / (data.length - 1)) * W;
  const py = (v) => max === min ? H / 2 : H - ((v - min) / (max - min)) * H;
  const pts = data.map((v, i) => `${px(i)},${py(v)}`).join(' ');

  return (
    <View>
      <Text style={chartStyles.label}>{label}</Text>
      <Svg width={W} height={H + 10}>
        <Polyline points={pts} fill="none" stroke="#C9A84C" strokeWidth={1.5} strokeLinejoin="round" />
        {data.map((v, i) => <Circle key={i} cx={px(i)} cy={py(v)} r={3} fill="#C9A84C" />)}
      </Svg>
    </View>
  );
}

function CalBar({ data, target }) {
  if (!data.length) return null;
  const W = CHART_W, H = 60, barW = Math.max(6, (W / data.length) - 4);
  const maxVal = Math.max(...data, target || 1);
  const bh = (v) => (v / maxVal) * H;
  const targetY = H - bh(target || 0);

  return (
    <View>
      <Text style={chartStyles.label}>Calories (last 7 days)</Text>
      <Svg width={W} height={H + 10}>
        {data.map((v, i) => (
          <Rect
            key={i} x={i * (W / data.length)} y={H - bh(v)}
            width={barW} height={bh(v)}
            fill="rgba(201,168,76,0.35)" stroke="#C9A84C" strokeWidth={0.5}
          />
        ))}
        {target ? <Line x1={0} y1={targetY} x2={W} y2={targetY} stroke="#C9A84C" strokeWidth={1} strokeDasharray="4,3" /> : null}
      </Svg>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  label: { fontFamily: 'CourierPrime_400Regular', color: '#8A7A62', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
});

// ─── TG·Adapt ─────────────────────────────────────────────────────────────────
function computeAdapt(logs, plan) {
  const recent = logs.slice(-7);
  if (recent.length < 3) return { title: 'Gathering data', body: 'Log at least 3 days to unlock your first adaptive insight.', adj: 0 };

  const avgCal = recent.reduce((s, l) => s + (l.calories || 0), 0) / recent.length;
  const weights = recent.map(l => parseFloat(l.weight)).filter(Boolean);
  const trend = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : 0;
  const goal  = plan.goal || 'maintenance';

  if (goal === 'weight_loss') {
    if (trend < -0.3) return { title: 'On track', body: `Weight dropped ${Math.abs(trend.toFixed(1))} kg this week. Keep current deficit.`, adj: 0 };
    if (trend > 0.2)  return { title: 'Adjust needed', body: 'Weight rose this week. Reducing calorie target by 5%.', adj: -0.05 };
    return { title: 'Monitoring', body: 'Weight is stable. Staying at current calories this week.', adj: 0 };
  }
  if (goal === 'muscle_gain') {
    if (trend > 0.1) return { title: 'Growing', body: `Weight up ${trend.toFixed(1)} kg. Lean bulk is on track.`, adj: 0 };
    return { title: 'Increase intake', body: 'Not gaining as expected. Raising calorie target by 5%.', adj: 0.05 };
  }
  return { title: 'Maintenance', body: `Averaging ${Math.round(avgCal)} kcal/day. Stable.`, adj: 0 };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }) {
  const [user, setUser]       = useState(null);
  const [weather, setWeather] = useState(null);
  const [todayLog, setLog]    = useState(null);
  const [logs, setLogs]       = useState([]);
  const [plan, setPlan]       = useState({ goal: 'maintenance', calTarget: 2000, proteinTarget: 150 });
  const [adapt, setAdapt]     = useState(null);

  // Log form state
  const [weight, setWeight] = useState('');
  const [steps, setSteps]   = useState('');
  const [workout, setWorkout] = useState('');
  const [hunger, setHunger] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [foods, setFoods]   = useState([]);
  const [logSaved, setLogSaved] = useState(false);

  // Modals
  const [addFoodModal, setAddFoodModal] = useState(false);
  const [barcodeModal, setBarcodeModal] = useState(false);
  const [newFood, setNewFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [scanLoading, setScanLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dateStr = () => {
    const now = new Date();
    return now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  };

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);

      const allLogs = await getDailyLogs();
      setLogs(allLogs);

      const today = await getTodayLog();
      setLog(today);
      setWeight(today.weight || '');
      setSteps(today.steps || '');
      setWorkout(today.workout || '');
      setHunger(today.hunger || 5);
      setEnergy(today.energy || 5);
      setFoods(today.foods || []);

      const p = await getUserPlan();
      setPlan(p);
      setAdapt(computeAdapt(allLogs, p));

      // Weather
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          const wx = await fetchWeather(loc.coords.latitude, loc.coords.longitude);
          setWeather(wx);
        } catch (_) {}
      }
    })();
  }, []);

  async function saveLog() {
    const log = {
      date: new Date().toISOString().slice(0, 10),
      weight, steps, workout, hunger, energy, foods,
      calories: foods.reduce((s, f) => s + (parseInt(f.calories) || 0), 0),
      protein:  foods.reduce((s, f) => s + (parseInt(f.protein) || 0), 0),
      carbs:    foods.reduce((s, f) => s + (parseInt(f.carbs) || 0), 0),
      fat:      foods.reduce((s, f) => s + (parseInt(f.fat) || 0), 0),
    };
    await saveDailyLog(log);
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 2000);
  }

  function addFood() {
    if (!newFood.name.trim()) return;
    setFoods(fs => [...fs, { ...newFood }]);
    setNewFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setAddFoodModal(false);
  }

  async function onBarcodeScan({ data }) {
    setBarcodeModal(false);
    setScanLoading(true);
    try {
      const p = await lookupBarcode(data);
      setFoods(fs => [...fs, { name: p.name, calories: String(p.calories), protein: String(p.protein), carbs: String(p.carbs), fat: String(p.fat) }]);
    } catch {
      Alert.alert('Not found', 'Could not find that product in the database.');
    } finally {
      setScanLoading(false);
    }
  }

  // Chart data
  const recentLogs = logs.slice(-7);
  const weightData = recentLogs.map(l => parseFloat(l.weight)).filter(Boolean);
  const calData    = recentLogs.map(l => l.calories || 0);

  // Progress stats
  const streak = (() => {
    let s = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      if (logs.find(l => l.date === ds)) s++;
      else break;
    }
    return s;
  })();

  const avgSteps = recentLogs.length
    ? Math.round(recentLogs.reduce((s, l) => s + (parseInt(l.steps) || 0), 0) / recentLogs.length)
    : 0;

  const todayKcal = foods.reduce((s, f) => s + (parseInt(f.calories) || 0), 0);

  if (!user) {
    return <View style={styles.safe}><ActivityIndicator color={colors.gold} style={{ flex: 1 }} /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.logo}>METABOLISM</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('AI')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>AI</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => { await clearUser(); navigation.replace('Home'); }} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Text style={styles.heroDate}>{dateStr()}</Text>
          <Text style={styles.heroGreeting}>{greeting()},{'\n'}<Text style={{ color: colors.gold }}>{user.fullName || user.username}</Text>.</Text>

          {/* Weather widget */}
          {weather ? (
            <View style={styles.wxWidget}>
              <View style={styles.wxIconBox}>
                <WeatherIcon code={weather.code} />
                <Text style={styles.wxCode}>{weather.wxCode}</Text>
              </View>
              <View style={{ marginLeft: spacing.md }}>
                <Text style={styles.wxTemp}>{weather.temperature}°C</Text>
                <Text style={styles.wxLabel}>{weather.label}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.wxWidget}>
              <ActivityIndicator color={colors.gold} size="small" />
              <Text style={[styles.wxLabel, { marginLeft: spacing.sm }]}>Fetching weather…</Text>
            </View>
          )}

          {/* Hero actions */}
          <View style={styles.heroActions}>
            <TouchableOpacity onPress={() => navigation.navigate('AI')} style={styles.heroBtnPrimary}>
              <Text style={styles.heroBtnText}>Open AI →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                if (!permission?.granted) await requestPermission();
                setBarcodeModal(true);
              }}
              style={styles.heroBtnSecondary}
            >
              <Text style={styles.heroBtnSecondaryText}>Scan barcode</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Log Today ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTag}>DAILY LOG</Text>
          <Text style={styles.sectionTitle}>Log today</Text>

          <View style={styles.row2}>
            <View style={styles.half2}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput style={styles.logInput} value={weight} onChangeText={setWeight}
                placeholder="—" placeholderTextColor={colors.text3} keyboardType="decimal-pad" />
            </View>
            <View style={styles.half2}>
              <Text style={styles.inputLabel}>Steps</Text>
              <TextInput style={styles.logInput} value={steps} onChangeText={setSteps}
                placeholder="—" placeholderTextColor={colors.text3} keyboardType="number-pad" />
            </View>
          </View>

          <Text style={styles.inputLabel}>Workout</Text>
          <TextInput style={styles.logInput} value={workout} onChangeText={setWorkout}
            placeholder="e.g. Push day, 45 min run…" placeholderTextColor={colors.text3} />

          {/* Sliders (faked with +/- buttons) */}
          <View style={styles.sliderRow}>
            <Text style={styles.inputLabel}>Hunger  <Text style={{ color: colors.gold }}>{hunger}/10</Text></Text>
            <View style={styles.sliderBtns}>
              <TouchableOpacity onPress={() => setHunger(h => Math.max(1, h - 1))} style={styles.sliderBtn}><Text style={styles.sliderBtnText}>−</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setHunger(h => Math.min(10, h + 1))} style={styles.sliderBtn}><Text style={styles.sliderBtnText}>+</Text></TouchableOpacity>
            </View>
          </View>

          <View style={styles.sliderRow}>
            <Text style={styles.inputLabel}>Energy  <Text style={{ color: colors.gold }}>{energy}/10</Text></Text>
            <View style={styles.sliderBtns}>
              <TouchableOpacity onPress={() => setEnergy(e => Math.max(1, e - 1))} style={styles.sliderBtn}><Text style={styles.sliderBtnText}>−</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setEnergy(e => Math.min(10, e + 1))} style={styles.sliderBtn}><Text style={styles.sliderBtnText}>+</Text></TouchableOpacity>
            </View>
          </View>

          {/* Food items */}
          <View style={styles.foodHeader}>
            <Text style={styles.inputLabel}>Food today  <Text style={{ color: colors.gold }}>{todayKcal} kcal</Text></Text>
            <View style={styles.foodHeaderBtns}>
              <TouchableOpacity onPress={() => setAddFoodModal(true)} style={styles.addFoodBtn}>
                <Text style={styles.addFoodBtnText}>+ Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => { if (!permission?.granted) await requestPermission(); setBarcodeModal(true); }}
                style={styles.addFoodBtn}
              >
                <Text style={styles.addFoodBtnText}>Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
          {foods.map((f, i) => (
            <View key={i} style={styles.foodRow}>
              <Text style={styles.foodName}>{f.name}</Text>
              <Text style={styles.foodCal}>{f.calories} kcal</Text>
              <TouchableOpacity onPress={() => setFoods(fs => fs.filter((_, j) => j !== i))}>
                <Text style={styles.foodDel}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity onPress={saveLog} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>{logSaved ? 'Saved ✓' : 'Save log'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── TG·Adapt ── */}
        {adapt && (
          <View style={[styles.section, styles.adaptCard]}>
            <Text style={styles.adaptEye}>M·ADAPT // WEEKLY INSIGHT</Text>
            <Text style={styles.adaptTitle}>{adapt.title}</Text>
            <Text style={styles.adaptBody}>{adapt.body}</Text>
          </View>
        )}

        {/* ── Progress ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTag}>PROGRESS</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Streak',   value: `${streak}d` },
              { label: 'Avg steps', value: avgSteps.toLocaleString() },
              { label: 'Days logged', value: logs.length },
              { label: 'Cal today', value: todayKcal },
            ].map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {weightData.length > 1 && <SparkLine data={weightData} label="Weight trend (kg)" />}
          {calData.some(Boolean) && <View style={{ marginTop: spacing.md }}><CalBar data={calData} target={plan.calTarget} /></View>}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Add Food Modal ── */}
      <Modal visible={addFoodModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add food</Text>
            {['name','calories','protein','carbs','fat'].map(k => (
              <View key={k} style={{ marginBottom: spacing.sm }}>
                <Text style={styles.inputLabel}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                <TextInput
                  style={styles.logInput}
                  value={newFood[k]}
                  onChangeText={t => setNewFood(f => ({ ...f, [k]: t }))}
                  placeholder={k === 'name' ? 'e.g. Chicken rice bowl' : '0'}
                  placeholderTextColor={colors.text3}
                  keyboardType={k === 'name' ? 'default' : 'number-pad'}
                />
              </View>
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setAddFoodModal(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addFood} style={styles.modalConfirm}>
                <Text style={styles.modalConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Barcode Scanner Modal ── */}
      <Modal visible={barcodeModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.scanHeader}>
              <Text style={styles.scanTitle}>Scan barcode</Text>
              <TouchableOpacity onPress={() => setBarcodeModal(false)}>
                <Text style={styles.scanClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {permission?.granted ? (
              <CameraView
                style={{ flex: 1 }}
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'] }}
                onBarcodeScanned={onBarcodeScan}
              >
                <View style={styles.scanOverlay}>
                  <View style={styles.scanFrame} />
                  <Text style={styles.scanHint}>Point at a product barcode</Text>
                </View>
              </CameraView>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.mono, color: colors.text2, textAlign: 'center', padding: spacing.lg }}>
                  Camera permission is required to scan barcodes.
                </Text>
                <TouchableOpacity onPress={requestPermission} style={styles.modalConfirm}>
                  <Text style={styles.modalConfirmText}>Grant permission</Text>
                </TouchableOpacity>
              </View>
            )}
            {scanLoading && (
              <View style={styles.scanLoading}>
                <ActivityIndicator color={colors.gold} />
                <Text style={styles.scanHint}>Looking up product…</Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  logo: { fontFamily: fonts.display, color: colors.gold, fontSize: 14, letterSpacing: 3 },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 6 },
  headerBtnText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 11, letterSpacing: 1.5 },

  hero: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  heroDate: { fontFamily: fonts.mono, color: colors.text3, fontSize: 10, letterSpacing: 2, marginBottom: spacing.xs },
  heroGreeting: { fontFamily: fonts.display, color: colors.text, fontSize: 30, lineHeight: 38, marginBottom: spacing.lg },

  wxWidget: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  wxIconBox: { alignItems: 'center', gap: 4 },
  wxCode: { fontFamily: fonts.display, color: '#060606', backgroundColor: colors.gold, fontSize: 10, letterSpacing: 1.5, paddingHorizontal: 7, paddingVertical: 3 },
  wxTemp: { fontFamily: fonts.display, color: colors.text, fontSize: 24 },
  wxLabel: { fontFamily: fonts.mono, color: colors.text2, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 },

  heroActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  heroBtnPrimary: { backgroundColor: colors.gold, paddingVertical: 11, paddingHorizontal: spacing.lg },
  heroBtnText: { fontFamily: fonts.mono, color: '#080808', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  heroBtnSecondary: { borderWidth: 1, borderColor: colors.border, paddingVertical: 11, paddingHorizontal: spacing.lg },
  heroBtnSecondaryText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13 },

  section: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTag: { fontFamily: fonts.mono, color: colors.text3, fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 },
  sectionTitle: { fontFamily: fonts.display, color: colors.text, fontSize: 22, marginBottom: spacing.md },

  row2: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  half2: { flex: 1 },
  inputLabel: { fontFamily: fonts.mono, color: colors.text2, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  logInput: {
    fontFamily: fonts.mono, color: colors.text, fontSize: 14,
    borderBottomWidth: 1, borderBottomColor: colors.borderInput,
    paddingVertical: 8, paddingHorizontal: 2, letterSpacing: 0.3,
  },

  sliderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sliderBtns: { flexDirection: 'row', gap: spacing.xs },
  sliderBtn: { borderWidth: 1, borderColor: colors.border, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  sliderBtnText: { fontFamily: fonts.mono, color: colors.gold, fontSize: 18 },

  foodHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  foodHeaderBtns: { flexDirection: 'row', gap: spacing.xs },
  addFoodBtn: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 6 },
  addFoodBtnText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 11, letterSpacing: 1 },

  foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.08)' },
  foodName: { flex: 1, fontFamily: fonts.mono, color: colors.text, fontSize: 13 },
  foodCal: { fontFamily: fonts.mono, color: colors.gold, fontSize: 12, marginRight: spacing.sm },
  foodDel: { fontFamily: fonts.mono, color: colors.text3, fontSize: 18, paddingHorizontal: 4 },

  saveBtn: { backgroundColor: colors.gold, padding: 13, alignItems: 'center', marginTop: spacing.lg },
  saveBtnText: { fontFamily: fonts.mono, color: '#080808', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },

  adaptCard: { backgroundColor: colors.surface },
  adaptEye: { fontFamily: fonts.mono, color: colors.text3, fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 },
  adaptTitle: { fontFamily: fonts.display, color: colors.gold, fontSize: 20, marginBottom: spacing.xs },
  adaptBody: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13, lineHeight: 20 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statBox: { flex: 1, minWidth: '45%', borderWidth: 1, borderColor: colors.border, padding: spacing.md, backgroundColor: colors.surface },
  statValue: { fontFamily: fonts.display, color: colors.text, fontSize: 24, marginBottom: 4 },
  statLabel: { fontFamily: fonts.mono, color: colors.text2, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.lg, paddingBottom: 40 },
  modalTitle: { fontFamily: fonts.display, color: colors.text, fontSize: 20, marginBottom: spacing.lg },
  modalBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center' },
  modalCancelText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 12, letterSpacing: 1 },
  modalConfirm: { flex: 1, backgroundColor: colors.gold, padding: 12, alignItems: 'center' },
  modalConfirmText: { fontFamily: fonts.mono, color: '#080808', fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  scanHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  scanTitle: { fontFamily: fonts.display, color: colors.text, fontSize: 20 },
  scanClose: { fontFamily: fonts.mono, color: colors.text2, fontSize: 20 },
  scanOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 160, borderWidth: 2, borderColor: colors.gold },
  scanHint: { fontFamily: fonts.mono, color: colors.text2, fontSize: 12, marginTop: spacing.md, letterSpacing: 0.5 },
  scanLoading: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center', gap: spacing.sm },
});
