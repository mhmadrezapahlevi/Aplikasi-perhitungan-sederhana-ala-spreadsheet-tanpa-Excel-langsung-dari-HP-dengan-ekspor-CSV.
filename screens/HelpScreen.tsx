import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, ThemeMode } from '../lib/theme';
import { useStore } from '../lib/store';
import PrimaryButton from '../components/PrimaryButton';
import { useToast } from '../lib/toast';
import { wipeAll } from '../lib/storage';

const CARA = [
  'Ketuk sel mana pun di grid untuk memilihnya.',
  'Ketik angka, teks, atau rumus di kolom fx, lalu tekan OK.',
  'Gunakan tombol + / − untuk menambah baris dan kolom.',
  'Tekan Simpan ke Arsip, lalu Ekspor CSV untuk output sheet.',
];

const RUMUS: { code: string; desc: string }[] = [
  { code: '=A1+B1*2', desc: 'Aritmetika: + − × ÷ ^ ( ) dan persen %' },
  { code: '=SUM(A1:A20)', desc: 'Jumlah semua angka dalam rentang' },
  { code: '=AVERAGE(B2:B9)', desc: 'Rata-rata (alias AVG)' },
  { code: '=MIN(A1:A10) / =MAX(A1:A10)', desc: 'Nilai terkecil dan terbesar' },
  { code: '=COUNT(A1:A10)', desc: 'Berapa banyak sel berisi angka' },
  { code: '=ROUND(A1/3; 2)', desc: 'Bulatkan ke 2 desimal' },
  { code: '=ABS(A1-B1)', desc: 'Nilai absolut' },
  { code: '=SQRT(144)', desc: 'Akar pangkat dua' },
  { code: '=POWER(2; 10)', desc: 'Pangkat, hasil 1024' },
  { code: '=IF(A1>=80; "Lulus"; "Remedial")', desc: 'Percabangan kondisi' },
  { code: '=AND(A1>0; B1>0)', desc: 'AND, OR, NOT' },
  { code: '=A1>=100', desc: 'Perbandingan = <> < > <= >= menghasilkan 1 / 0' },
];

export default function HelpScreen() {
  const { theme, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { reload, createNew } = useStore();

  const reset = () => {
    Alert.alert('Hapus semua data?', 'Seluruh sheet tersimpan dan riwayat kalkulator akan hilang.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await wipeAll();
          createNew();
          await reload();
          toast.show('Semua data dihapus', 'trash');
        },
      },
    ]);
  };

  const modes: { key: ThemeMode; label: string }[] = [
    { key: 'auto', label: 'Auto' },
    { key: 'light', label: 'Terang' },
    { key: 'dark', label: 'Gelap' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 32 }}
    >
      <Text style={[styles.title, { color: theme.text }]}>Bantuan</Text>
      <Text style={[styles.subtitle, { color: theme.sub }]}>
        LembarHitung menghitung seperti spreadsheet ringan, langsung dari ponsel — tanpa Excel.
      </Text>

      <Card title="Cara pakai">
        {CARA.map((t, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={[styles.stepNum, { backgroundColor: theme.accentSoft }]}>
              <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 11 }}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>{t}</Text>
          </View>
        ))}
      </Card>

      <Card title="Rumus yang didukung">
        {RUMUS.map((r, i) => (
          <View key={i} style={[styles.rumusRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.rumusCode, { color: theme.accent }]}>{r.code}</Text>
            <Text style={[styles.rumusDesc, { color: theme.sub }]}>{r.desc}</Text>
          </View>
        ))}
        <Text style={[styles.note, { color: theme.sub }]}>
          Pemisah argumen memakai titik koma (;) maupun koma (,), keduanya diterima.
        </Text>
      </Card>

      <Card title="Format keluaran CSV">
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Pilih Nilai untuk hasil hitungan atau Rumus untuk menyimpan isi sel asli. Tentukan pemisah kolom
          (koma untuk Excel internasional, titik koma untuk Excel Indonesia/Eropa), sertakan header A, B, C
          bila diperlukan, lalu Salin, Bagikan, atau Unduh berkas .csv.
        </Text>
      </Card>

      <Card title="Tampilan">
        <View style={[styles.segment, { backgroundColor: theme.cardAlt }]}>
          {modes.map((m) => {
            const active = mode === m.key;
            return (
              <Text
                key={m.key}
                onPress={() => setMode(m.key)}
                style={[
                  styles.segmentItem,
                  active && { backgroundColor: theme.accent, color: theme.accentText },
                  { color: active ? theme.accentText : theme.sub },
                ]}
              >
                {m.label}
              </Text>
            );
          })}
        </View>
      </Card>

      <Card title="Data">
        <Text style={[styles.paragraph, { color: theme.sub }]}>
          Semua sheet disimpan lokal di perangkat ini. Menghapus data tidak bisa dibatalkan.
        </Text>
        <PrimaryButton label="Hapus semua data" icon="trash-outline" variant="danger" onPress={reset} style={{ marginTop: 12 }} />
      </Card>

      <Text style={[styles.footer, { color: theme.sub }]}>LembarHitung · versi 1.0</Text>
    </ScrollView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12.5, lineHeight: 19, marginTop: 5, marginBottom: 14 },
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 14,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 19 },
  rumusRow: { paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  rumusCode: { fontSize: 12.5, fontWeight: '700' },
  rumusDesc: { fontSize: 11.5, marginTop: 3, lineHeight: 16 },
  note: { fontSize: 11.5, marginTop: 12, lineHeight: 17 },
  paragraph: { fontSize: 13, lineHeight: 20 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  segmentItem: { flex: 1, textAlign: 'center', paddingVertical: 9, borderRadius: 9, fontWeight: '700', fontSize: 12.5, overflow: 'hidden' },
  footer: { fontSize: 11, textAlign: 'center', marginTop: 6 },
});
