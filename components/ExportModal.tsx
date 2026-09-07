import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../lib/theme';
import { CellEval } from '../lib/engine';
import { Sheet } from '../lib/storage';
import { buildCsv, csvFileName } from '../lib/csv';
import { useToast } from '../lib/toast';
import PrimaryButton from './PrimaryButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  sheet: Sheet;
  evals: Record<string, CellEval>;
};

function ExportModal({ visible, onClose, sheet, evals }: Props) {
  const { theme } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [formulas, setFormulas] = useState(false);
  const [headers, setHeaders] = useState(true);
  const [bom, setBom] = useState(true);
  const [delimiter, setDelimiter] = useState(',');

  const rawCsv = useMemo(
    () => buildCsv(sheet, evals, { formulas, delimiter, includeHeaders: headers }),
    [sheet, evals, formulas, headers, delimiter]
  );
  const fileName = csvFileName(sheet);
  const sizeKb = ((rawCsv.length + (bom ? 3 : 0)) / 1024).toFixed(1);
  const preview = useMemo(() => {
    const lines = rawCsv.split('\n').slice(0, 7);
    return lines.join('\n') + (rawCsv.split('\n').length > 7 ? '\n…' : '');
  }, [rawCsv]);

  const onCopy = async () => {
    try {
      await Clipboard.setStringAsync((bom ? '\uFEFF' : '') + rawCsv);
      toast.show('CSV disalin ke clipboard', 'copy');
      onClose();
    } catch (e) {
      toast.show('Gagal menyalin CSV', 'alert-circle');
    }
  };

  const onShare = async () => {
    try {
      await Share.share({ message: (bom ? '\uFEFF' : '') + rawCsv, title: fileName });
      onClose();
    } catch (e) {
      toast.show('Membagikan dibatalkan', 'information-circle');
    }
  };

  const onDownload = () => {
    if (typeof document === 'undefined') return;
    const blob = new Blob([(bom ? '\uFEFF' : '') + rawCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast.show(fileName + ' diunduh', 'download');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={FadeInDown.duration(240)}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.bg,
              borderColor: theme.border,
              paddingBottom: insets.bottom + 18,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: theme.border }]} />
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>Ekspor ke CSV</Text>
              <Text style={[styles.sub, { color: theme.sub }]}>
                {fileName} · {sheet.rows} baris × {sheet.cols} kolom · {sizeKb} KB
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: theme.cardAlt }]}>
              <Ionicons name="close" size={18} color={theme.sub} />
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <OptionRow
              label="Konten"
              options={[
                { key: 'value', label: 'Nilai' },
                { key: 'formula', label: 'Rumus' },
              ]}
              value={formulas ? 'formula' : 'value'}
              onChange={(k) => setFormulas(k === 'formula')}
            />
            <Divider />
            <OptionRow
              label="Pemisah kolom"
              options={[
                { key: ',', label: 'Koma' },
                { key: ';', label: 'Titik koma' },
              ]}
              value={delimiter}
              onChange={setDelimiter}
            />
            <Divider />
            <ToggleRow
              label="Header kolom (A, B, C…)"
              value={headers}
              onChange={setHeaders}
            />
            <Divider />
            <ToggleRow label="BOM UTF-8 (kompatibel Excel)" value={bom} onChange={setBom} />
          </View>

          <View style={[styles.preview, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.previewLabel, { color: theme.sub }]}>PRATINJAU</Text>
            <Text style={[styles.previewText, { color: theme.text }]} selectable>
              {preview}
            </Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Salin" icon="copy-outline" variant="soft" onPress={onCopy} style={{ flex: 1 }} />
            <PrimaryButton label="Bagikan" icon="share-outline" variant="soft" onPress={onShare} style={{ flex: 1 }} />
          </View>
          <PrimaryButton
            label={Platform.OS === 'web' ? 'Unduh ' + fileName : 'Simpan ke File'}
            icon="download-outline"
            onPress={Platform.OS === 'web' ? onDownload : onShare}
            style={{ marginTop: 10 }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function Divider() {
  const { theme } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />;
}

function OptionRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (k: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.optRow}>
      <Text style={[styles.optLabel, { color: theme.text }]}>{label}</Text>
      <View style={[styles.segment, { backgroundColor: theme.cardAlt }]}>
        {options.map((o) => {
          const active = o.key === value;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              style={[
                styles.segmentItem,
                active && { backgroundColor: theme.accent },
              ]}
            >
              <Text
                style={{
                  color: active ? theme.accentText : theme.sub,
                  fontWeight: '700',
                  fontSize: 12.5,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.optRow}>
      <Text style={[styles.optLabel, { color: theme.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.accent, false: theme.border }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(6,12,22,0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingTop: 10,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  grabber: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 3 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  optLabel: { fontSize: 13.5, fontWeight: '600', flexShrink: 1 },
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 3 },
  segmentItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  preview: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  previewLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  previewText: { fontSize: 11.5, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});

export default ExportModal;
