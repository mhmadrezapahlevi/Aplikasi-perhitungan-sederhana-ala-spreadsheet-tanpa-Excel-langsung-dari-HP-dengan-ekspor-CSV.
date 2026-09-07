import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../lib/theme';
import { EMPTY_ENV, evalFormula, formatNum } from '../lib/engine';
import { TapeEntry, getTape, saveTape, uid } from '../lib/storage';
import { useToast } from '../lib/toast';

const ROWS: string[][] = [
  ['AC', 'back', '(', ')'],
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['0', '.', '%', '+'],
];

const OPS = '+−×÷^%';

function translate(expr: string): string {
  return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
}

export default function CalculatorScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [expr, setExpr] = useState('');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastPlain, setLastPlain] = useState<string | null>(null);
  const [justEval, setJustEval] = useState(false);
  const [tape, setTape] = useState<TapeEntry[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    getTape()
      .then((t) => {
        if (loaded.current) return;
        loaded.current = true;
        setTape(Array.isArray(t) ? t : []);
      })
      .catch(() => {});
  }, []);

  const persist = (list: TapeEntry[]) => {
    setTape(list);
    saveTape(list).catch(() => {});
  };

  const preview = useMemo(() => {
    if (!expr) return null;
    const v = evalFormula(translate(expr), EMPTY_ENV);
    return v.t === 'n' ? formatNum(v.v) : null;
  }, [expr]);

  const display = justEval ? lastResult || '0' : preview || (expr ? '…' : '0');

  const press = (k: string) => {
    if (k === 'AC') {
      setExpr('');
      setLastResult(null);
      setLastPlain(null);
      setJustEval(false);
      return;
    }
    if (k === 'back') {
      setExpr((e) => e.slice(0, -1));
      setJustEval(false);
      return;
    }
    if (k === '=') {
      if (!expr) return;
      const v = evalFormula(translate(expr), EMPTY_ENV);
      if (v.t === 'n') {
        const out = formatNum(v.v);
        setLastResult(out);
        setLastPlain(String(Math.round(v.v * 1e10) / 1e10));
        const entry: TapeEntry = { id: uid(), expr, result: out, at: Date.now() };
        persist([entry, ...tape].slice(0, 40));
      } else {
        setLastResult(v.t === 'e' ? v.v : '#ERROR!');
      }
      setJustEval(true);
      return;
    }
    if (justEval) {
      if (OPS.indexOf(k) >= 0 && lastPlain) {
        setExpr(lastPlain + k);
      } else {
        setExpr(k);
      }
      setJustEval(false);
      return;
    }
    setExpr((e) => e + k);
  };

  const clearTape = () => {
    Alert.alert('Hapus riwayat?', 'Semua perhitungan cepat akan dihapus.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => { persist([]); toast.show('Riwayat dikosongkan', 'trash'); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 6 }}>
        <Text style={[styles.title, { color: theme.text }]}>Kalkulator Cepat</Text>
        <Text style={[styles.subtitle, { color: theme.sub }]}>
          Hasil otomatis tersimpan di riwayat, mendukung kurung, pangkat, dan persen
        </Text>
      </View>

      <View style={[styles.display, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <Text numberOfLines={1} style={[styles.expr, { color: theme.sub }]}>
          {expr || 'Ketuk angka untuk mulai'}
        </Text>
        <Animated.Text key={display} entering={FadeIn.duration(160)} numberOfLines={1} style={[styles.result, { color: theme.text }]}>
          {display}
        </Animated.Text>
        {justEval && preview === null && lastResult ? (
          <Text style={[styles.hint, { color: theme.accent }]}>= selesai, ketuk operator untuk lanjut</Text>
        ) : null}
      </View>

      <View style={[styles.pad, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {ROWS.map((row, ri) => (
          <View key={'row' + ri} style={styles.padRow}>
            {row.map((k) => {
              const isFn = k === 'AC' || k === 'back';
              const isOp = OPS.indexOf(k) >= 0 || k === '(' || k === ')';
              const bg = isFn ? theme.cardAlt : isOp ? theme.accentSoft : theme.cardAlt;
              const fg = k === 'AC' ? theme.danger : isOp ? theme.accent : theme.text;
              return (
                <Pressable
                  key={k}
                  onPress={() => press(k)}
                  style={({ pressed }) => [
                    styles.key,
                    { backgroundColor: bg, borderColor: theme.border },
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  {k === 'back' ? (
                    <Ionicons name="backspace-outline" size={19} color={fg} />
                  ) : (
                    <Text style={[styles.keyText, { color: fg }]}>{k}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
        <View style={styles.padRow}>
          <Pressable
            onPress={() => press('=')}
            style={({ pressed }) => [styles.equals, { backgroundColor: theme.accent }, pressed && { opacity: 0.8 }]}
          >
            <Text style={{ color: theme.accentText, fontSize: 19, fontWeight: '800' }}>=</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tapeHead}>
        <Text style={[styles.tapeTitle, { color: theme.text }]}>Riwayat</Text>
        {tape.length ? (
          <Pressable onPress={clearTape} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="trash-outline" size={14} color={theme.danger} />
            <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '700' }}>Kosongkan</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={tape}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        ListEmptyComponent={
          <Text style={[styles.emptyTape, { color: theme.sub }]}>Belum ada perhitungan. Tekan “=” untuk menyimpan hasil.</Text>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 40).duration(260)}>
            <Pressable
              onPress={() => {
                setExpr((e) => (justEval && lastPlain ? lastPlain : e) + item.result.replace(/\./g, '').replace(',', '.'));
                setJustEval(false);
              }}
              style={({ pressed }) => [
                styles.tapeRow,
                { backgroundColor: theme.card, borderColor: theme.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.tapeExpr, { color: theme.sub }]}>
                  {item.expr}
                </Text>
                <Text style={[styles.tapeTime, { color: theme.sub }]}>{formatJam(item.at)}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.tapeResult, { color: theme.text }]}>
                {item.result}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      />
    </View>
  );
}

function formatJam(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  return pad(d.getHours()) + ':' + pad(d.getMinutes());
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  display: {
    margin: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  expr: { fontSize: 13, textAlign: 'right', minHeight: 18 },
  result: { fontSize: 38, fontWeight: '800', textAlign: 'right', marginTop: 4 },
  hint: { fontSize: 11, textAlign: 'right', marginTop: 6, fontWeight: '600' },
  pad: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 8,
  },
  padRow: { flexDirection: 'row', gap: 8 },
  key: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 18, fontWeight: '700' },
  equals: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
  },
  tapeTitle: { fontSize: 13.5, fontWeight: '800' },
  emptyTape: { fontSize: 12.5, textAlign: 'center', paddingTop: 22, lineHeight: 19 },
  tapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  tapeExpr: { fontSize: 12.5 },
  tapeTime: { fontSize: 10.5, marginTop: 2 },
  tapeResult: { fontSize: 15, fontWeight: '800', maxWidth: '45%' },
});
