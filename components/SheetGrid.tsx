import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/theme';
import { CellEval, colLabel } from '../lib/engine';
import Cell from './Cell';

export const CELL_W = 98;
export const CELL_H = 42;
export const LABEL_W = 46;

type Props = {
  rows: number;
  cols: number;
  evals: Record<string, CellEval>;
  selected: string;
  onSelect: (key: string) => void;
};

function SheetGrid({ rows, cols, evals, selected, onSelect }: Props) {
  const { theme } = useTheme();
  const rowIdx = useMemo(() => Array.from({ length: rows }, (_, i) => i), [rows]);
  const colIdx = useMemo(() => Array.from({ length: cols }, (_, i) => i), [cols]);

  return (
    <ScrollView
      horizontal
      style={{ flex: 1, backgroundColor: theme.card }}
      contentContainerStyle={{ width: LABEL_W + cols * CELL_W }}
      showsHorizontalScrollIndicator={false}
    >
      <ScrollView style={{ flex: 1 }} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <View style={[styles.headCell, { width: LABEL_W, backgroundColor: theme.gridHead, borderColor: theme.border }]}>
            <Text style={[styles.headText, { color: theme.sub }]}>#</Text>
          </View>
          {colIdx.map((c) => (
            <View
              key={'h' + c}
              style={[styles.headCell, { width: CELL_W, backgroundColor: theme.gridHead, borderColor: theme.border }]}
            >
              <Text style={[styles.headText, { color: theme.accent }]}>{colLabel(c)}</Text>
            </View>
          ))}
        </View>
        {rowIdx.map((r) => (
          <View key={'r' + r} style={styles.row}>
            <View style={[styles.rowLabel, { width: LABEL_W, backgroundColor: theme.gridHead, borderColor: theme.border }]}>
              <Text style={[styles.headText, { color: theme.sub }]}>{r + 1}</Text>
            </View>
            {colIdx.map((c) => {
              const key = colLabel(c) + (r + 1);
              const ce = evals[key];
              return (
                <Cell
                  key={key}
                  width={CELL_W}
                  height={CELL_H}
                  label={ce ? ce.display : ''}
                  selected={selected === key}
                  isNum={!!(ce && ce.isNum)}
                  isError={!!(ce && ce.isError)}
                  isFormula={!!(ce && ce.raw.charAt(0) === '=')}
                  onPress={() => onSelect(key)}
                />
              );
            })}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  headCell: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    height: CELL_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  headText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
});

export default React.memo(SheetGrid);
