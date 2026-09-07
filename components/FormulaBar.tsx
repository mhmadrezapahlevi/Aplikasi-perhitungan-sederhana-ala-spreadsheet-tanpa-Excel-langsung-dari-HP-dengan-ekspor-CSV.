import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../lib/theme';

type Props = {
  selected: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  inputRef: React.RefObject<TextInput | null>;
};

function FormulaBar({ selected, value, onChange, onSubmit, inputRef }: Props) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
      ]}
    >
      <View style={[styles.chip, { backgroundColor: theme.gridHead }]}>
        <Text style={[styles.chipText, { color: theme.accent }]}>{selected}</Text>
      </View>
      <Pressable onPress={() => onChange(value.charAt(0) === '=' ? value : '=' + value)} style={styles.fx} hitSlop={8}>
        <Text style={[styles.fxText, { color: theme.accent }]}>fx</Text>
      </Pressable>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder="Angka, teks, atau =SUM(A1:A4)"
        placeholderTextColor={theme.sub}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        selectionColor={theme.accent}
        style={[styles.input, { color: theme.text }]}
      />
      <Pressable onPress={onSubmit} style={[styles.apply, { backgroundColor: theme.accent }]} hitSlop={8}>
        <Text style={{ color: theme.accentText, fontWeight: '800', fontSize: 13 }}>OK</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  chipText: { fontSize: 12, fontWeight: '800' },
  fx: { paddingHorizontal: 4 },
  fxText: { fontSize: 14, fontStyle: 'italic', fontWeight: '800' },
  input: { flex: 1, fontSize: 14, paddingVertical: 6 },
  apply: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
});

export default FormulaBar;
