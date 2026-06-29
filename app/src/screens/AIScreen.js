import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, Modal, Alert,
  ActivityIndicator, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import RunnerFigure from '../components/RunnerFigure';
import { sendChatMessage, lookupBarcode } from '../services/api';
import { getUser, getSessions, saveSession, deleteSession } from '../services/storage';
import { colors, fonts, spacing } from '../theme';

const { width } = Dimensions.get('window');

function escapeHtml(t) { return t.replace(/</g, '&lt;'); }

// Render message text with basic markdown (bold, code)
function MsgText({ text, style }) {
  return <Text style={style}>{text}</Text>;
}

function MessageBubble({ msg, isRunning }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAI]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
      )}
      <View style={[styles.msgWrap, isUser ? styles.msgWrapUser : styles.msgWrapAI]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <MsgText text={msg.content} style={[styles.bubbleText, isUser && styles.bubbleTextUser]} />
          {msg.images?.map((uri, i) => (
            <View key={i} style={styles.imgAttach}>
              <Text style={styles.imgLabel}>📷 Image attached</Text>
            </View>
          ))}
        </View>
        {/* Running figure appears below AI messages while generating */}
        {!isUser && msg.streaming && (
          <View style={styles.runnerBox}>
            <RunnerFigure isRunning={isRunning} />
          </View>
        )}
      </View>
      {isUser && (
        <View style={[styles.avatar, styles.avatarUser]}>
          <Text style={styles.avatarText}>U</Text>
        </View>
      )}
    </View>
  );
}

// Typewriter hook — adds characters one by one
function useTypewriter(target, isActive) {
  const [displayed, setDisplayed] = useState('');
  const timerRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!isActive) return;
    setDisplayed('');
    indexRef.current = 0;

    function tick() {
      if (indexRef.current <= target.length) {
        setDisplayed(target.slice(0, indexRef.current));
        indexRef.current++;
        const delay = target[indexRef.current - 1] === '\n' ? 28 : 6;
        timerRef.current = setTimeout(tick, delay);
      }
    }
    tick();
    return () => clearTimeout(timerRef.current);
  }, [target, isActive]);

  return displayed;
}

export default function AIScreen({ navigation }) {
  const [user, setUser]               = useState(null);
  const [sessions, setSessions]       = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [history, setHistory]         = useState([]);
  const [messages, setMessages]       = useState([]); // [{role, content, images, streaming}]
  const [inputText, setInputText]     = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingImages, setPendingImages] = useState([]);
  const [typingText, setTypingText]   = useState('');
  const [typingDone, setTypingDone]   = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [barcodeModal, setBarcodeModal] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const listRef = useRef(null);
  const abortRef = useRef(false);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      const s = await getSessions();
      setSessions(s);
      newChat();
    })();
  }, []);

  function newChat() {
    const id = Date.now().toString();
    setCurrentSessionId(id);
    setHistory([]);
    setMessages([]);
    setInputText('');
    setPendingImages([]);
  }

  async function loadSession(session) {
    setCurrentSessionId(session.id);
    setHistory(session.messages || []);
    setMessages((session.messages || []).map(m => ({ role: m.role, content: m.content })));
    setShowSidebar(false);
  }

  function scrollToEnd() {
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
  }

  async function handleSend() {
    if (isGenerating) { abortRef.current = true; return; }
    const text = inputText.trim();
    if (!text && !pendingImages.length) return;

    const fullText = text || (pendingImages.length ? 'Please analyse this food image and estimate the calories and macros.' : '');
    setInputText('');

    const userMsg = { role: 'user', content: fullText, images: pendingImages };
    const newHistory = [...history, { role: 'user', content: fullText }];
    setHistory(newHistory);
    setMessages(prev => [...prev, { ...userMsg, streaming: false }]);
    setPendingImages([]);
    scrollToEnd();

    // Add placeholder for assistant message
    const streamId = Date.now();
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true, id: streamId }]);
    setIsGenerating(true);
    abortRef.current = false;
    scrollToEnd();

    try {
      const apiMsgs = newHistory.map((m, i) =>
        i === newHistory.length - 1 && userMsg.images?.length
          ? { ...m, images: userMsg.images }
          : m
      );
      const reply = await sendChatMessage(apiMsgs);

      if (abortRef.current) {
        setMessages(prev => prev.map(m => m.streaming ? { ...m, content: reply, streaming: false } : m));
        setIsGenerating(false);
        return;
      }

      // Typewrite the reply
      setMessages(prev => prev.map(m => m.streaming ? { ...m, content: '' } : m));
      const chars = reply.split('');
      let built = '';
      for (let i = 0; i < chars.length; i++) {
        if (abortRef.current) break;
        built += chars[i];
        const snap = built;
        setMessages(prev => prev.map(m => m.streaming ? { ...m, content: snap } : m));
        await new Promise(r => setTimeout(r, chars[i] === '\n' ? 30 : 6));
      }

      const finalReply = built;
      setMessages(prev => prev.map(m => m.streaming ? { ...m, content: finalReply, streaming: false } : m));

      const updatedHistory = [...newHistory, { role: 'assistant', content: finalReply }];
      setHistory(updatedHistory);

      // Save session
      const session = {
        id: currentSessionId,
        title: fullText.slice(0, 48) + (fullText.length > 48 ? '…' : ''),
        messages: updatedHistory,
        updatedAt: new Date().toISOString(),
      };
      await saveSession(session);
      setSessions(await getSessions());

    } catch (err) {
      if (!abortRef.current) {
        setMessages(prev => prev.map(m =>
          m.streaming ? { ...m, content: 'Having trouble connecting. Please check your server URL in config.js and try again.', streaming: false } : m
        ));
      }
    } finally {
      setIsGenerating(false);
      scrollToEnd();
    }
  }

  async function pickImage() {
    setShowPlusMenu(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const dataUri = `data:image/jpeg;base64,${asset.base64}`;
      setPendingImages(prev => [...prev, dataUri]);
    }
  }

  async function takePhoto() {
    setShowPlusMenu(false);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const dataUri = `data:image/jpeg;base64,${asset.base64}`;
      setPendingImages(prev => [...prev, dataUri]);
    }
  }

  async function onBarcodeScan({ data }) {
    setBarcodeModal(false);
    setScanLoading(true);
    try {
      const p = await lookupBarcode(data);
      const text = `I just scanned a product: ${p.name}${p.brand ? ` by ${p.brand}` : ''}. Per 100g: ${p.calories} kcal, ${p.protein}g protein, ${p.carbs}g carbs, ${p.fat}g fat. Can you help me log this?`;
      setInputText(text);
    } catch {
      Alert.alert('Not found', 'Could not find that product. You can manually enter the food name.');
    } finally {
      setScanLoading(false);
    }
  }

  const renderMsg = useCallback(({ item }) => (
    <MessageBubble msg={item} isRunning={isGenerating && item.streaming} />
  ), [isGenerating]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TG·AI</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={newChat} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>+ New</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* ── Messages ── */}
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>TG·AI</Text>
            <Text style={styles.emptyTag}>METABOLIC INTELLIGENCE</Text>
            <Text style={styles.emptySub}>
              Ask about nutrition, log food by photo or barcode, get personalised meal advice, or analyse your progress.
            </Text>
            {[
              'What should I eat to lose 5 kg while preserving muscle?',
              'Analyse my week — am I eating enough protein?',
              'Give me a high-protein meal under 600 calories.',
            ].map(q => (
              <TouchableOpacity key={q} onPress={() => { setInputText(q); }} style={styles.suggestBtn}>
                <Text style={styles.suggestText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <ScrollView
            ref={listRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.md, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} isRunning={isGenerating && !!msg.streaming} />
            ))}
          </ScrollView>
        )}

        {/* Pending images pill */}
        {pendingImages.length > 0 && (
          <View style={styles.pendingBar}>
            <Text style={styles.pendingText}>{pendingImages.length} image{pendingImages.length > 1 ? 's' : ''} attached</Text>
            <TouchableOpacity onPress={() => setPendingImages([])}>
              <Text style={styles.pendingClear}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Composer ── */}
        <View style={styles.composer}>
          <View style={styles.composerInner}>
            <TextInput
              style={styles.composerInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask anything about nutrition…"
              placeholderTextColor={colors.text3}
              multiline
              maxLength={4000}
            />
            <View style={styles.composerBottom}>
              {/* Left: plus + mic */}
              <View style={styles.composerLeft}>
                <View>
                  <TouchableOpacity onPress={() => setShowPlusMenu(s => !s)} style={styles.composerBtn}>
                    <Text style={styles.composerBtnText}>+</Text>
                  </TouchableOpacity>
                  {showPlusMenu && (
                    <View style={styles.plusMenu}>
                      <TouchableOpacity style={styles.plusItem} onPress={takePhoto}>
                        <Text style={styles.plusItemText}>Take food photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.plusItem} onPress={pickImage}>
                        <Text style={styles.plusItemText}>Upload photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.plusItem} onPress={async () => { setShowPlusMenu(false); if (!permission?.granted) await requestPermission(); setBarcodeModal(true); }}>
                        <Text style={styles.plusItemText}>Scan barcode</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              {/* Right: char count + send/stop */}
              <View style={styles.composerRight}>
                {inputText.length > 200 && (
                  <Text style={styles.charCount}>{inputText.length}/4000</Text>
                )}
                <TouchableOpacity
                  onPress={handleSend}
                  style={[styles.sendBtn, isGenerating && styles.sendBtnStop]}
                >
                  <Text style={styles.sendBtnText}>{isGenerating ? '■' : '→'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Sidebar (session history) ── */}
      <Modal visible={showSidebar} animationType="slide" transparent>
        <View style={styles.sidebarOverlay}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Sessions</Text>
              <TouchableOpacity onPress={() => setShowSidebar(false)}>
                <Text style={styles.sidebarClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => { newChat(); setShowSidebar(false); }} style={styles.newChatBtn}>
              <Text style={styles.newChatBtnText}>+ New chat</Text>
            </TouchableOpacity>
            <ScrollView style={{ flex: 1 }}>
              {sessions.map(s => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => loadSession(s)}
                  onLongPress={async () => {
                    await deleteSession(s.id);
                    setSessions(await getSessions());
                    if (s.id === currentSessionId) newChat();
                  }}
                  style={[styles.sessionItem, s.id === currentSessionId && styles.sessionItemActive]}
                >
                  <Text style={styles.sessionTitle} numberOfLines={2}>{s.title}</Text>
                  <Text style={styles.sessionDate}>{new Date(s.updatedAt).toLocaleDateString()}</Text>
                </TouchableOpacity>
              ))}
              {sessions.length === 0 && (
                <Text style={styles.noSessions}>No saved sessions yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Barcode Modal ── */}
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
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
                onBarcodeScanned={onBarcodeScan}
              >
                <View style={styles.scanOverlay}>
                  <View style={styles.scanFrame} />
                  <Text style={styles.scanHint}>Point at a product barcode</Text>
                </View>
              </CameraView>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
                <Text style={{ fontFamily: fonts.mono, color: colors.text2, textAlign: 'center', marginBottom: spacing.lg }}>
                  Camera permission needed to scan barcodes.
                </Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
                  <Text style={styles.permBtnText}>Grant permission</Text>
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
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontFamily: fonts.display, color: colors.gold, fontSize: 18, letterSpacing: 2 },
  headerRight: { flexDirection: 'row', gap: spacing.xs },
  headerBtn: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  headerBtnText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 12, letterSpacing: 1 },

  empty: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xxl },
  emptyTitle: { fontFamily: fonts.display, color: colors.gold, fontSize: 36, letterSpacing: 3, marginBottom: spacing.xs },
  emptyTag: { fontFamily: fonts.mono, color: colors.text3, fontSize: 9, letterSpacing: 3, marginBottom: spacing.lg },
  emptySub: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13, lineHeight: 22, marginBottom: spacing.xl },
  suggestBtn: { borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  suggestText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 12, lineHeight: 18 },

  msgRow: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.sm },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAI:   { justifyContent: 'flex-start' },
  msgWrap: { flex: 1, maxWidth: '85%' },
  msgWrapUser: { alignItems: 'flex-end', maxWidth: '80%' },
  msgWrapAI:   { alignItems: 'flex-start' },

  avatar: {
    width: 28, height: 28, borderRadius: 0,
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarUser: { backgroundColor: 'rgba(201,168,76,0.16)', borderColor: colors.gold },
  avatarText: { fontFamily: fonts.display, color: colors.gold, fontSize: 12 },

  bubble: { padding: spacing.sm },
  bubbleUser: { backgroundColor: 'rgba(201,168,76,0.08)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' },
  bubbleAI:   { backgroundColor: 'transparent' },
  bubbleText: { fontFamily: fonts.mono, color: colors.text, fontSize: 14, lineHeight: 22, letterSpacing: 0.3 },
  bubbleTextUser: { color: colors.text },
  imgAttach: { marginTop: spacing.xs, borderWidth: 1, borderColor: colors.border, padding: spacing.xs },
  imgLabel: { fontFamily: fonts.mono, color: colors.text2, fontSize: 11 },

  runnerBox: { marginTop: spacing.xs },

  pendingBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
    backgroundColor: 'rgba(201,168,76,0.08)', borderTopWidth: 1, borderTopColor: colors.border,
  },
  pendingText: { fontFamily: fonts.mono, color: colors.gold, fontSize: 12 },
  pendingClear: { fontFamily: fonts.mono, color: colors.text2, fontSize: 16 },

  composer: {
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    backgroundColor: colors.bg,
  },
  composerInner: {
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, padding: spacing.sm,
  },
  composerInput: {
    fontFamily: fonts.mono, color: colors.text, fontSize: 14, lineHeight: 22,
    maxHeight: 120, letterSpacing: 0.3, paddingTop: 0,
  },
  composerBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.xs },
  composerLeft:  { flexDirection: 'row', gap: spacing.xs },
  composerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  composerBtn: {
    width: 30, height: 30, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  composerBtnText: { fontFamily: fonts.mono, color: colors.gold, fontSize: 20 },

  plusMenu: {
    position: 'absolute', bottom: 36, left: 0, width: 200,
    backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.border, zIndex: 100,
  },
  plusItem: { padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  plusItemText: { fontFamily: fonts.mono, color: colors.text2, fontSize: 13, letterSpacing: 0.3 },

  charCount: { fontFamily: fonts.mono, color: colors.text3, fontSize: 10 },
  sendBtn: {
    backgroundColor: colors.gold, width: 34, height: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnStop: { backgroundColor: 'rgba(201,168,76,0.25)', borderWidth: 1, borderColor: colors.gold },
  sendBtnText: { fontFamily: fonts.mono, color: '#080808', fontSize: 16, fontWeight: '700' },

  sidebarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row' },
  sidebar: { width: width * 0.8, backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.border },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sidebarTitle: { fontFamily: fonts.display, color: colors.text, fontSize: 20 },
  sidebarClose: { fontFamily: fonts.mono, color: colors.text2, fontSize: 20 },
  newChatBtn: { margin: spacing.md, borderWidth: 1, borderColor: colors.gold, padding: spacing.sm, alignItems: 'center' },
  newChatBtnText: { fontFamily: fonts.mono, color: colors.gold, fontSize: 13, letterSpacing: 1 },
  sessionItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  sessionItemActive: { backgroundColor: 'rgba(201,168,76,0.06)' },
  sessionTitle: { fontFamily: fonts.mono, color: colors.text, fontSize: 13, lineHeight: 18 },
  sessionDate: { fontFamily: fonts.mono, color: colors.text3, fontSize: 10, marginTop: 4 },
  noSessions: { fontFamily: fonts.mono, color: colors.text3, fontSize: 12, padding: spacing.lg, textAlign: 'center' },

  scanHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  scanTitle: { fontFamily: fonts.display, color: colors.text, fontSize: 20 },
  scanClose: { fontFamily: fonts.mono, color: colors.text2, fontSize: 20 },
  scanOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 160, borderWidth: 2, borderColor: colors.gold },
  scanHint: { fontFamily: fonts.mono, color: colors.text2, fontSize: 12, marginTop: spacing.md },
  scanLoading: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center', gap: spacing.sm },
  permBtn: { backgroundColor: colors.gold, paddingVertical: 12, paddingHorizontal: spacing.xl },
  permBtnText: { fontFamily: fonts.mono, color: '#080808', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});
