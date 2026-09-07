import { Sheet } from './storage';
import { CellEval, colLabel } from './engine';

export type CsvOptions = {
  formulas: boolean;
  delimiter: string;
  includeHeaders: boolean;
};

export function csvCell(value: string, delimiter: string): string {
  const v = value == null ? '' : String(value);
  if (v.indexOf('"') >= 0 || v.indexOf(delimiter) >= 0 || v.indexOf('\n') >= 0 || v.indexOf('\r') >= 0) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

export function buildCsv(sheet: Sheet, evals: Record<string, CellEval>, opt: CsvOptions): string {
  const d = opt.delimiter;
  const lines: string[] = [];
  if (opt.includeHeaders) {
    const head = [''];
    for (let c = 0; c < sheet.cols; c++) head.push(colLabel(c));
    lines.push(head.map((h) => csvCell(h, d)).join(d));
  }
  for (let r = 0; r < sheet.rows; r++) {
    const row: string[] = [opt.includeHeaders ? String(r + 1) : ''];
    for (let c = 0; c < sheet.cols; c++) {
      const key = colLabel(c) + (r + 1);
      const ce = evals[key];
      if (!ce || ce.raw === '') row.push('');
      else if (opt.formulas) row.push(ce.raw);
      else if (ce.isNum && ce.value !== null) row.push(String(Math.round(ce.value * 1e10) / 1e10));
      else row.push(ce.display);
    }
    lines.push(row.map((x) => csvCell(x, d)).join(d));
  }
  return lines.join('\n');
}

export function csvFileName(sheet: Sheet): string {
  const base = (sheet.name || 'sheet').trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || 'sheet';
  return base + '.csv';
}
