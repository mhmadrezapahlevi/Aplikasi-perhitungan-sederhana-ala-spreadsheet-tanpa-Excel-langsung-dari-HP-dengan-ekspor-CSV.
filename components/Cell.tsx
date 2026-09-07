import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/theme';

type Props = {
  label: string;
  selected: boolean;
  isNum: boolean;
  isError: boolean;
  isFormula: boolean;
  width: number;
  height: number;
  onPress: () => void;
};

function Cell({ label, selected, isNum, isError, isFormula, width, height, onPress }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        {
          width,
          height,
          backgroundColor: selected ? theme.accentSoft : theme.card,
          borderRightColor: theme.border,
          borderBottomColor: theme.border,
        },
        selected && { borderColor: theme.accent },
        pressed && { opacity: 0.65 },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          {
            color: isError ? theme.danger : isNum ? theme.text : theme.sub,
            textAlign: isNum ? 'right' : 'left',
            fontWeight: isNum ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
      {isFormula ? <View style={[styles.dot, { backgroundColor: theme.accent }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: { fontSize: 13 },
  dot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default React.memo(Cell);
