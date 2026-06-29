import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER:        'toogood_user',
  SESSIONS:    'toogood_pro_sessions',
  DAILY_LOGS:  'toogood_daily_logs',
  USER_PLAN:   'toogood_user_plan',
  FOLDERS:     'toogood_folders',
};

// ─── User ────────────────────────────────────────────────────────────────────

export async function saveUser(user) {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function getUser() {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

export async function clearUser() {
  await AsyncStorage.removeItem(KEYS.USER);
}

// ─── Daily logs ───────────────────────────────────────────────────────────────
// Each log: { date, weight, calories, protein, carbs, fat, steps, workout, hunger, energy, foods: [] }

export async function getDailyLogs() {
  const raw = await AsyncStorage.getItem(KEYS.DAILY_LOGS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveDailyLog(log) {
  const logs = await getDailyLogs();
  const today = log.date;
  const idx   = logs.findIndex(l => l.date === today);
  if (idx >= 0) logs[idx] = log; else logs.push(log);
  await AsyncStorage.setItem(KEYS.DAILY_LOGS, JSON.stringify(logs));
}

export async function getTodayLog() {
  const today = new Date().toISOString().slice(0, 10);
  const logs  = await getDailyLogs();
  return logs.find(l => l.date === today) || {
    date: today, weight: '', calories: 0, protein: 0, carbs: 0, fat: 0,
    steps: '', workout: '', hunger: 5, energy: 5, foods: [],
  };
}

// ─── Chat sessions ───────────────────────────────────────────────────────────
// Each session: { id, title, messages: [{role, content}], updatedAt }

export async function getSessions() {
  const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveSession(session) {
  const sessions = await getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session; else sessions.unshift(session);
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
}

export async function deleteSession(id) {
  const sessions = await getSessions();
  await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions.filter(s => s.id !== id)));
}

// ─── Adaptive plan ───────────────────────────────────────────────────────────

export async function getUserPlan() {
  const raw = await AsyncStorage.getItem(KEYS.USER_PLAN);
  return raw ? JSON.parse(raw) : { goal: 'maintenance', calTarget: 2000, proteinTarget: 150 };
}

export async function saveUserPlan(plan) {
  await AsyncStorage.setItem(KEYS.USER_PLAN, JSON.stringify(plan));
}
