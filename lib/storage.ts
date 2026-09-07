import AsyncStorage from '@react-native-async-storage/async-storage';

export type Sheet = {
  id: string;
  name: string;
  rows: number;
  cols: number;
  cells: Record<string, string>;
  createdAt: number;
  updatedAt: number;
};

export type TapeEntry = {
  id: string;
  expr: string;
  result: string;
  at: number;
};

const K_SHEETS = 'sheetwork.sheets.v2';
const K_DRAFT = 'sheetwork.draft.v2';
const K_TAPE = 'sheetwork.tape.v2';

export const MIN_ROWS = 3;
export const MAX_ROWS = 100;
export const MIN_COLS = 2;
export const MAX_COLS = 14;

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function newSheet(name: string): Sheet {
  const now = Date.now();
  return { id: uid(), name, rows: 14, cols: 6, cells: {}, createdAt: now, updatedAt: now };
}

export function demoSheet(): Sheet {
  const now = Date.now();
  return {
    id: uid(),
    name: 'Contoh Belanja',
    rows: 14,
    cols: 6,
    cells: {
      A1: 'Item',
      B1: 'Harga',
      C1: 'Qty',
      D1: 'Total',
      A2: 'Kopi',
      B2: '25000',
      C2: '2',
      D2: '=B2*C2',
      A3: 'Teh',
      B3: '12000',
      C3: '3',
      D3: '=B3*C3',
      A4: 'Roti',
      B4: '9000',
      C4: '5',
      D4: '=B4*C4',
      A6: 'Total',
      D6: '=SUM(D2:D4)',
      A7: 'Rata-rata',
      D7: '=ROUND(AVERAGE(D2:D4);0)',
    },
    createdAt: now,
    updatedAt: now,
  };
}

async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    return fallback;
  }
}

async function setJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

export function getSheets(): Promise<Sheet[]> {
  return getJson<Sheet[]>(K_SHEETS, []);
}

export function saveSheets(sheets: Sheet[]): Promise<void> {
  return setJson(K_SHEETS, sheets);
}

export function getDraft(): Promise<Sheet | null> {
  return getJson<Sheet | null>(K_DRAFT, null);
}

export function saveDraft(sheet: Sheet): Promise<void> {
  return setJson(K_DRAFT, sheet);
}

export function getTape(): Promise<TapeEntry[]> {
  return getJson<TapeEntry[]>(K_TAPE, []);
}

export function saveTape(tape: TapeEntry[]): Promise<void> {
  return setJson(K_TAPE, tape);
}

export async function wipeAll(): Promise<void> {
  try {
    await AsyncStorage.removeItem(K_SHEETS);
    await AsyncStorage.removeItem(K_DRAFT);
    await AsyncStorage.removeItem(K_TAPE);
  } catch (e) {}
}
