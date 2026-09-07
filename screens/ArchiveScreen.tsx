import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../lib/theme';
import { useStore } from '../lib/store';
import { Sheet } from '../lib/storage';
import { evaluateSheet } from '../lib/engine';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import ExportModal from '../components/ExportModal';
import { useToast } from '../lib/toast';

export default function ArchiveScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { sheets, openSheet, deleteSheet, reload, createNew } = useStore();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [menu, setMenu] = useState<Sheet | null>(null);
  const [expSheet, setExpSheet] = useState<Sheet | null>(null);

  const expEvals = useMemo(
    () => (expSheet ? evaluateSheet(expSheet.cells, expSheet.rows, expSheet.cols) : {}),
    [expSheet]
  );

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sheets
      .filter((s) => (q ? s.name.toLowerCase().indexOf(q) >= 0 : true))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sheets, query]);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const open = (s: Sheet) => {
    openSheet(s.id);
    navigation.navigate('Sheet', { sheetId: s.id });
  };

  const confirmDelete = (s: Sheet) => {
    Alert.alert('Hapus sheet?', '"' + s.name + '" akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await deleteSheet(s.id);
          toast.show('Sheet dihapus', 'trash');
        },
      },
    ]);
  };

  const newSheet = () => {
    createNew();
    navigation.navigate('Sheet', { sheetId: 'draft' });
    toast.show('Sheet baru siap diisi', 'document-text');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Arsip Sheet</Text>
            <Text style={[styles.subtitle, { color: theme.sub }]}>
              {sheets.length} sheet tersimpan di perangkat
            </Text>
          </View>
          <Pressable onPress={newSheet} style={[styles.addBtn, { backgroundColor: theme.accent }]}>
            <Ionicons name="add" size={22} color={theme.accentText} />
          </Pressable>
        </View>
        <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={15} color={theme.sub} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cari sheet…"
            placeholderTextColor={theme.sub}
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor={theme.accent}
            style={{ flex: 1, color: theme.text, fontSize: 13.5, paddingVertical: 2 }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.sub} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        ListEmptyComponent={
          sheets.length === 0 ? (
            <EmptyState
              icon="folder-open-outline"
              title="Belum ada sheet tersimpan"
              subtitle="Isi sheet di tab Sheet, lalu tekan Simpan ke Arsip agar muncul di sini."
            />
          ) : (
            <EmptyState icon="search-outline" title="Tidak ditemukan" subtitle={'Tidak ada sheet dengan kata "' + query + '".'} />
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(300)}>
            <Pressable
              onPress={() => open(item)}
              onLongPress={() => setMenu(item)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="grid" size={18} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.text }]}>
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={[styles.cardMeta, { color: theme.sub }]}>
                  {item.rows}×{item.cols} · {countFilled(item)} sel · {formatWhen(item.updatedAt)}
                </Text>
              </View>
              <Pressable onPress={() => setMenu(item)} hitSlop={8} style={styles.more}>
                <Ionicons name="ellipsis-horizontal" size={18} color={theme.sub} />
              </Pressable>
            </Pressable>
          </Animated.View>
        )}
      />

      <Modal visible={!!menu} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenu(null)} />
          <View style={[styles.menu, { backgroundColor: theme.card, borderColor: theme.border, paddingBottom: insets.bottom + 14 }]}>
            <Text numberOfLines={1} style={[styles.menuTitle, { color: theme.text }]}>
              {menu ? menu.name : ''}
            </Text>
            <MenuRow icon="open-outline" label="Buka di editor" onPress={() => { const s = menu; setMenu(null); if (s) open(s); }} />
            <MenuRow
              icon="download-outline"
              label="Ekspor CSV"
              onPress={() => { const s = menu; setMenu(null); setExpSheet(s); }}
            />
            <MenuRow
              icon="trash-outline"
              label="Hapus"
              danger
              onPress={() => { const s = menu; setMenu(null); if (s) confirmDelete(s); }}
            />
          </View>
        </View>
      </Modal>

      {expSheet ? (
        <ExportModal visible onClose={() => setExpSheet(null)} sheet={expSheet} evals={expEvals} />
      ) : null}
    </View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: theme.cardAlt }]}
    >
      <Ionicons name={icon} size={18} color={danger ? theme.danger : theme.accent} />
      <Text style={{ color: danger ? theme.danger : theme.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

function countFilled(s: Sheet): number {
  let n = 0;
  for (const k of Object.keys(s.cells)) if ((s.cells[k] || '').trim() !== '') n++;
  return n;
}

export function formatWhen(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  const time = pad(d.getHours()) + ':' + pad(d.getMinutes());
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return 'Hari ini ' + time;
  const yest = new Date(now.getTime() - 86400000);
  if (d.toDateString() === yest.toDateString()) return 'Kemarin ' + time;
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + time;
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 3 },
  addBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14.5, fontWeight: '700' },
  cardMeta: { fontSize: 11.5, marginTop: 3 },
  more: { padding: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(6,12,22,0.5)', justifyContent: 'flex-end' },
  menu: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  menuTitle: { fontSize: 15, fontWeight: '800', paddingHorizontal: 10, marginBottom: 10 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
});
