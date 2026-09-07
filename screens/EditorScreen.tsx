import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../lib/theme';
import { useStore } from '../lib/store';
import { evaluateSheet, formatNum } from '../lib/engine';
import { MAX_COLS, MAX_ROWS, MIN_COLS, MIN_ROWS } from '../lib/storage';
import SheetGrid from '../components/SheetGrid';
import FormulaBar from '../components/FormulaBar';
import PrimaryButton from '../components/PrimaryButton';
import ExportModal from '../components/ExportModal';
import { useToast } from '../lib/toast';

export default function EditorScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const route = useRoute<any>();
  const { active: sheet, activeId, openSheet, updateActive, saveActive, createNew } = useStore();

  const [selected, setSelected] = useState('A1');
  const [text, setText] = useState(sheet.cells['A1'] || '');
  const [showExport, setShowExport] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [nameDraft, setNameDraft] = useState(sheet.name);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const id = route.params && route.params.sheetId;
    if (id) openSheet(id);
  }, [route.params]);

  useEffect(() => {
    setText(sheet.cells[selected] || '');
  }, [selected, sheet.id]);

  const evals = useMemo(
    () => evaluateSheet(sheet.cells, sheet.rows, sheet.cols),
    [sheet.cells, sheet.rows, sheet.cols]
  );
  const sel = evals[selected];

  const filled = useMemo(() => {
    let n = 0;
    for (const k of Object.keys(sheet.cells)) {
      if ((sheet.cells[k] || '').trim() !== '') n++;
    }
    return n;
  }, [sheet.cells]);

  const onSelect = (key: string) => {
    if (key === selected) {
      inputRef.current?.focus();
      return;
    }
    setSelected(key);
  };

  const commit = () => {
    const cells = { ...sheet.cells };
    const v = text.trim();
    if (v === '') delete cells[selected];
    else cells[selected] = v;
    updateActive({ cells });
    Keyboard.dismiss();
  };

  const doSave = async () => {
    await saveActive();
    toast.show(activeId === 'draft' ? 'Sheet disimpan ke arsip' : 'Perubahan tersimpan', 'cloud-done');
  };

  const adjustRows = (delta: number) => {
    const rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, sheet.rows + delta));
    if (rows === sheet.rows) {
      toast.show(delta > 0 ? 'Maksimal ' + MAX_ROWS + ' baris' : 'Minimal ' + MIN_ROWS + ' baris', 'information-circle');
      return;
    }
    updateActive({ rows });
  };

  const adjustCols = (delta: number) => {
    const cols = Math.max(MIN_COLS, Math.min(MAX_COLS, sheet.cols + delta));
    if (cols === sheet.cols) {
      toast.show(delta > 0 ? 'Maksimal ' + MAX_COLS + ' kolom' : 'Minimal ' + MIN_COLS + ' kolom', 'information-circle');
      return;
    }
    updateActive({ cols });
  };

  const commitName = () => {
    const n = nameDraft.trim();
    if (n) updateActive({ name: n });
    setShowRename(false);
    Keyboard.dismiss();
    if (n) toast.show('Nama sheet diperbarui', 'text');
  };

  const hasil = sel
    ? sel.isNum && sel.value !== null
      ? formatNum(sel.value)
      : sel.display || '0'
    : '0';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={() => { setNameDraft(sheet.name); setShowRename(true); }}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
              {sheet.name}
            </Text>
            <Ionicons name="pencil" size={13} color={theme.sub} />
          </View>
          <Text style={[styles.subtitle, { color: theme.sub }]}>
            {filled} sel terisi · {sheet.rows}×{sheet.cols}
            {activeId === 'draft' ? ' · draf' : ''}
          </Text>
        </Pressable>
        <HeaderBtn icon="add-circle-outline" onPress={() => { createNew(); setSelected('A1'); toast.show('Sheet baru dibuat', 'document-text'); }} />
        <HeaderBtn icon="save-outline" onPress={doSave} />
        <HeaderBtn icon="download-outline" onPress={() => setShowExport(true)} />
      </View>

      <FormulaBar
        selected={selected}
        value={text}
        onChange={setText}
        onSubmit={commit}
        inputRef={inputRef}
      />

      <View
        style={[
          styles.status,
          { backgroundColor: theme.cardAlt, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.statusRef, { color: theme.accent }]}>{selected}</Text>
        <Text numberOfLines={1} style={[styles.statusRaw, { color: theme.sub }]}>
          {sel && sel.raw ? sel.raw : '—'}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.statusValue,
            { color: sel && sel.isError ? theme.danger : theme.text },
          ]}
        >
          {hasil}
        </Text>
      </View>

      <SheetGrid rows={sheet.rows} cols={sheet.cols} evals={evals} selected={selected} onSelect={onSelect} />

      <View style={[styles.toolbar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <PrimaryButton label="Baris" icon="add" variant="ghost" size="sm" onPress={() => adjustRows(1)} style={{ flex: 1 }} />
        <PrimaryButton label="Baris" icon="remove" variant="ghost" size="sm" onPress={() => adjustRows(-1)} style={{ flex: 1 }} />
        <PrimaryButton label="Kolom" icon="add" variant="ghost" size="sm" onPress={() => adjustCols(1)} style={{ flex: 1 }} />
        <PrimaryButton label="Kolom" icon="remove" variant="ghost" size="sm" onPress={() => adjustCols(-1)} style={{ flex: 1 }} />
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, backgroundColor: theme.card }}>
        <PrimaryButton label="Simpan ke Arsip" icon="checkmark-done" onPress={doSave} />
      </View>

      <ExportModal visible={showExport} onClose={() => setShowExport(false)} sheet={sheet} evals={evals} />

      <Modal visible={showRename} transparent animationType="fade" onRequestClose={() => setShowRename(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowRename(false)} />
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Ubah Nama Sheet</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={commitName}
              placeholder="Nama sheet"
              placeholderTextColor={theme.sub}
              selectionColor={theme.accent}
              style={[
                styles.modalInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardAlt },
              ]}
            />
            <View style={styles.modalActions}>
              <PrimaryButton label="Batal" variant="ghost" onPress={() => setShowRename(false)} style={{ flex: 1 }} />
              <PrimaryButton label="Simpan" onPress={commitName} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function HeaderBtn({ icon, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.headerBtn,
        { backgroundColor: theme.cardAlt, borderColor: theme.border },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Ionicons name={icon} size={19} color={theme.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 18, fontWeight: '800', flexShrink: 1 },
  subtitle: { fontSize: 11.5, marginTop: 2 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 14,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusRef: { fontSize: 11, fontWeight: '800' },
  statusRaw: { fontSize: 11.5, flex: 1 },
  statusValue: { fontSize: 13, fontWeight: '800', maxWidth: '45%' },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6,12,22,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  modalInput: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
