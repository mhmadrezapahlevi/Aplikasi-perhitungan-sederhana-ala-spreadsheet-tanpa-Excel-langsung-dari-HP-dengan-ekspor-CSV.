export type Val =
  | { t: 'n'; v: number }
  | { t: 'e'; v: string }
  | { t: 's'; v: string }
  | { t: 'r'; v: Val[] };

export const num = (v: number): Val => ({ t: 'n', v });
export const er = (v: string): Val => ({ t: 'e', v });
export const str = (v: string): Val => ({ t: 's', v });

export type Env = {
  cell(ref: string): Val;
  range(a: string, b: string): Val[];
};

export type CellEval = {
  raw: string;
  display: string;
  value: number | null;
  isNum: boolean;
  isError: boolean;
};

type Tok =
  | { k: 'num'; v: number }
  | { k: 'ref'; v: string }
  | { k: 'name'; v: string }
  | { k: 'op'; v: string }
  | { k: 'str'; v: string }
  | { k: 'lp' }
  | { k: 'rp' }
  | { k: 'comma' };

const COMPARISONS = ['=', '<>', '<', '>', '<=', '>='];

export function colLabel(i: number): string {
  let s = '';
  let x = i;
  while (x >= 0) {
    s = String.fromCharCode(65 + (x % 26)) + s;
    x = Math.floor(x / 26) - 1;
  }
  return s;
}

export function refKey(r: number, c: number): string {
  return colLabel(c) + (r + 1);
}

export function parseRef(ref: string): { r: number; c: number } | null {
  const m = /^([A-Z]{1,3})([0-9]{1,4})$/i.exec(ref.trim());
  if (!m) return null;
  let c = 0;
  const letters = m[1].toUpperCase();
  for (let i = 0; i < letters.length; i++) c = c * 26 + (letters.charCodeAt(i) - 64);
  c -= 1;
  const r = parseInt(m[2], 10) - 1;
  if (r < 0 || c < 0 || r > 999 || c > 18000) return null;
  return { r, c };
}

export function tokenize(src: string): Tok[] | null {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }
    if (ch >= '0' && ch <= '9') {
      let j = i;
      while (j < src.length && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.' || src[j] === ',')) j++;
      const raw = src.slice(i, j).replace(/,/g, '.');
      const v = Number(raw);
      if (!isFinite(v)) return null;
      toks.push({ k: 'num', v });
      i = j;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9]/.test(src[j])) j++;
      const word = src.slice(i, j);
      if (/^[A-Za-z]{1,3}[0-9]{1,4}$/.test(word)) toks.push({ k: 'ref', v: word.toUpperCase() });
      else toks.push({ k: 'name', v: word.toUpperCase() });
      i = j;
      continue;
    }
    if (ch === '(') {
      toks.push({ k: 'lp' });
      i++;
      continue;
    }
    if (ch === ')') {
      toks.push({ k: 'rp' });
      i++;
      continue;
    }
    if (ch === ',' || ch === ';') {
      toks.push({ k: 'comma' });
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      let s = '';
      while (j < src.length && src[j] !== ch) {
        s += src[j];
        j++;
      }
      if (j >= src.length) return null;
      toks.push({ k: 'str', v: s });
      i = j + 1;
      continue;
    }
    if ('+-*/^%<>='.indexOf(ch) >= 0 || ch === ':') {
      let op = ch;
      if ((ch === '<' || ch === '>') && src[i + 1] === '=') {
        op = ch + '=';
        i++;
      } else if (ch === '<' && src[i + 1] === '>') {
        op = '<>';
        i++;
      } else if (ch === '=' && src[i + 1] === '=') {
        op = '=';
        i++;
      }
      toks.push({ k: 'op', v: op });
      i++;
      continue;
    }
    return null;
  }
  return toks;
}

function numeric(v: Val): Val {
  if (v.t === 'e') return v;
  if (v.t === 'n') return v;
  if (v.t === 'r') return er('#VALUE!');
  const s = v.v.trim();
  if (s === '') return num(0);
  const x = Number(s.replace(',', '.'));
  if (isFinite(x) && s.match(/^-?\d+(?:[.,]\d+)?$/)) return num(x);
  return er('#VALUE!');
}

function flatten(args: Val[]): Val[] {
  const out: Val[] = [];
  for (const a of args) {
    if (a.t === 'r') {
      for (const x of a.v) out.push(x);
    } else {
      out.push(a);
    }
  }
  return out;
}

function numsOf(args: Val[]): number[] {
  const out: number[] = [];
  for (const a of flatten(args)) {
    if (a.t === 'n') out.push(a.v);
    else if (a.t === 's' && a.v.trim() !== '') {
      const x = Number(a.v.replace(',', '.'));
      if (isFinite(x)) out.push(x);
    }
  }
  return out;
}

function firstErr(args: Val[]): Val | null {
  for (const a of flatten(args)) if (a.t === 'e') return a;
  return null;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

function callFn(name: string, args: Val[]): Val {
  const e = firstErr(args);
  if (e) return e;
  switch (name) {
    case 'SUM':
      return num(sum(numsOf(args)));
    case 'AVERAGE':
    case 'AVG': {
      const xs = numsOf(args);
      return xs.length ? num(sum(xs) / xs.length) : er('#DIV/0!');
    }
    case 'MIN': {
      const xs = numsOf(args);
      return xs.length ? num(Math.min.apply(null, xs)) : er('#VALUE!');
    }
    case 'MAX': {
      const xs = numsOf(args);
      return xs.length ? num(Math.max.apply(null, xs)) : er('#VALUE!');
    }
    case 'COUNT':
      return num(numsOf(args).length);
    case 'ROUND': {
      const xs = numsOf(args);
      if (!xs.length) return er('#VALUE!');
      const d = xs.length > 1 ? xs[1] : 0;
      const f = Math.pow(10, Math.max(-10, Math.min(10, d)));
      return num(Math.round(xs[0] * f) / f);
    }
    case 'ABS':
    case 'SQRT': {
      const xs = numsOf(args);
      if (!xs.length) return er('#VALUE!');
      if (name === 'ABS') return num(Math.abs(xs[0]));
      return xs[0] < 0 ? er('#NUM!') : num(Math.sqrt(xs[0]));
    }
    case 'POWER': {
      const xs = numsOf(args);
      if (xs.length < 2) return er('#VALUE!');
      const r = Math.pow(xs[0], xs[1]);
      return isFinite(r) ? num(r) : er('#NUM!');
    }
    case 'IF': {
      if (!args.length) return er('#VALUE!');
      const c = numeric(args[0]);
      if (c.t !== 'n') return c;
      return c.v !== 0 ? args[1] || num(1) : args[2] || num(0);
    }
    case 'AND': {
      const xs = numsOf(args);
      return num(xs.length && xs.every((x) => x !== 0) ? 1 : 0);
    }
    case 'OR': {
      const xs = numsOf(args);
      return num(xs.some((x) => x !== 0) ? 1 : 0);
    }
    case 'NOT': {
      const xs = numsOf(args);
      return num(xs.length && xs[0] !== 0 ? 0 : 1);
    }
    case 'CONCAT': {
      const s = flatten(args)
        .map((a) => (a.t === 'n' ? String(a.v) : a.v))
        .join('');
      return str(s);
    }
    default:
      return er('#NAME?');
  }
}

class Parser {
  i = 0;
  constructor(
    private toks: Tok[],
    private env: Env
  ) {}

  peek(): Tok | undefined {
    return this.toks[this.i];
  }

  next(): Tok {
    return this.toks[this.i++];
  }

  isOp(v: string): boolean {
    const t = this.peek();
    return !!t && t.k === 'op' && t.v === v;
  }

  parseExpr(): Val {
    return this.parseCmp();
  }

  parseCmp(): Val {
    let left = this.parseAdd();
    for (;;) {
      const t = this.peek();
      if (!t || t.k !== 'op' || COMPARISONS.indexOf(t.v) < 0) break;
      const op = t.v;
      this.i++;
      const right = this.parseAdd();
      if (left.t === 'e') return left;
      if (right.t === 'e') return right;
      const a = numeric(left);
      const b = numeric(right);
      if (a.t !== 'n') return a;
      if (b.t !== 'n') return b;
      let res = false;
      switch (op) {
        case '=':
          res = a.v === b.v;
          break;
        case '<>':
          res = a.v !== b.v;
          break;
        case '<':
          res = a.v < b.v;
          break;
        case '>':
          res = a.v > b.v;
          break;
        case '<=':
          res = a.v <= b.v;
          break;
        default:
          res = a.v >= b.v;
      }
      left = num(res ? 1 : 0);
    }
    return left;
  }

  parseAdd(): Val {
    let left = this.parseMul();
    while (this.isOp('+') || this.isOp('-')) {
      const op = (this.next() as { k: 'op'; v: string }).v;
      const right = this.parseMul();
      if (left.t === 'e') return left;
      if (right.t === 'e') return right;
      const a = numeric(left);
      const b = numeric(right);
      if (a.t !== 'n') return a;
      if (b.t !== 'n') return b;
      left = num(op === '+' ? a.v + b.v : a.v - b.v);
    }
    return left;
  }

  parseMul(): Val {
    let left = this.parseUnary();
    while (this.isOp('*') || this.isOp('/')) {
      const op = (this.next() as { k: 'op'; v: string }).v;
      const right = this.parseUnary();
      if (left.t === 'e') return left;
      if (right.t === 'e') return right;
      const a = numeric(left);
      const b = numeric(right);
      if (a.t !== 'n') return a;
      if (b.t !== 'n') return b;
      if (op === '*' ) left = num(a.v * b.v);
      else left = b.v === 0 ? er('#DIV/0!') : num(a.v / b.v);
    }
    return left;
  }

  parseUnary(): Val {
    if (this.isOp('-') || this.isOp('+')) {
      const op = (this.next() as { k: 'op'; v: string }).v;
      const v = this.parseUnary();
      if (v.t === 'e') return v;
      const a = numeric(v);
      if (a.t !== 'n') return a;
      return num(op === '-' ? -a.v : a.v);
    }
    return this.parsePower();
  }

  parsePower(): Val {
    const base = this.parsePostfix();
    if (this.isOp('^')) {
      this.i++;
      const exp = this.parsePower();
      if (base.t === 'e') return base;
      if (exp.t === 'e') return exp;
      const a = numeric(base);
      const b = numeric(exp);
      if (a.t !== 'n') return a;
      if (b.t !== 'n') return b;
      const r = Math.pow(a.v, b.v);
      return isFinite(r) ? num(r) : er('#NUM!');
    }
    return base;
  }

  parsePostfix(): Val {
    let v = this.parsePrimary();
    while (this.isOp('%')) {
      this.i++;
      if (v.t === 'e') return v;
      const a = numeric(v);
      if (a.t !== 'n') return a;
      v = num(a.v / 100);
    }
    return v;
  }

  parsePrimary(): Val {
    const t = this.peek();
    if (!t) return er('#SYNTAX!');
    if (t.k === 'num') {
      this.i++;
      return num(t.v);
    }
    if (t.k === 'str') {
      this.i++;
      return str(t.v);
    }
    if (t.k === 'ref') {
      this.i++;
      if (this.isOp(':')) {
        this.i++;
        const t2 = this.peek();
        if (!t2 || t2.k !== 'ref') return er('#REF!');
        this.i++;
        return { t: 'r', v: this.env.range(t.v, t2.v) };
      }
      return this.env.cell(t.v);
    }
    if (t.k === 'name') {
      this.i++;
      const p = this.peek();
      if (!p || p.k !== 'lp') return er('#NAME?');
      this.i++;
      const args: Val[] = [];
      const q = this.peek();
      if (q && q.k === 'rp') {
        this.i++;
      } else {
        for (;;) {
          args.push(this.parseCmp());
          const r = this.peek();
          if (r && r.k === 'comma') {
            this.i++;
            continue;
          }
          if (r && r.k === 'rp') {
            this.i++;
            break;
          }
          return er('#SYNTAX!');
        }
      }
      return callFn(t.v, args);
    }
    if (t.k === 'lp') {
      this.i++;
      const v = this.parseCmp();
      const p = this.peek();
      if (p && p.k === 'rp') this.i++;
      else return er('#SYNTAX!');
      return v;
    }
    return er('#SYNTAX!');
  }
}

export function evalFormula(src: string, env: Env): Val {
  const toks = tokenize(src);
  if (!toks || toks.length === 0) return er('#SYNTAX!');
  try {
    const p = new Parser(toks, env);
    const v = p.parseExpr();
    if (p.i !== toks.length) return er('#SYNTAX!');
    return v;
  } catch (e) {
    return er('#ERROR!');
  }
}

const NUM_RE = /^-?\d+(?:[.,]\d+)?$/;

export function evaluateSheet(
  cells: Record<string, string>,
  rows: number,
  cols: number
): Record<string, CellEval> {
  const cache: Record<string, Val> = {};
  const busy = new Set<string>();

  const cellVal = (ref: string): Val => {
    const key = ref.toUpperCase();
    if (key in cache) return cache[key];
    const pos = parseRef(key);
    if (!pos) return er('#REF!');
    let v: Val;
    if (pos.r >= rows || pos.c >= cols) {
      v = er('#REF!');
    } else if (busy.has(key)) {
      return er('#LOOP!');
    } else {
      const raw = (cells[key] || '').trim();
      if (raw === '') v = num(0);
      else if (raw.charAt(0) === '=') {
        busy.add(key);
        v = evalFormula(raw.slice(1), env);
        busy.delete(key);
        if (v.t === 'r') v = er('#VALUE!');
      } else if (NUM_RE.test(raw)) {
        v = num(Number(raw.replace(',', '.')));
      } else {
        v = str(raw);
      }
    }
    cache[key] = v;
    return v;
  };

  const env: Env = {
    cell: cellVal,
    range: (a, b) => {
      const p1 = parseRef(a);
      const p2 = parseRef(b);
      if (!p1 || !p2) return [er('#REF!')];
      const r1 = Math.min(p1.r, p2.r);
      const r2 = Math.max(p1.r, p2.r);
      const c1 = Math.min(p1.c, p2.c);
      const c2 = Math.max(p1.c, p2.c);
      const out: Val[] = [];
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          if (r >= rows || c >= cols) {
            out.push(num(0));
          } else {
            out.push(cellVal(refKey(r, c)));
          }
        }
      }
      return out;
    },
  };

  const out: Record<string, CellEval> = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = refKey(r, c);
      const raw = (cells[key] || '').trim();
      const v = cellVal(key);
      let display = '';
      let value: number | null = null;
      let isNum = false;
      let isError = false;
      if (raw !== '') {
        if (v.t === 'n') {
          isNum = true;
          value = v.v;
          display = formatNum(v.v);
        } else if (v.t === 'e') {
          isError = true;
          display = v.v;
        } else if (v.t === 's') {
          display = v.v;
        }
      }
      out[key] = { raw, display, value, isNum, isError };
    }
  }
  return out;
}

export function formatNum(v: number): string {
  if (!isFinite(v)) return '#NUM!';
  const abs = Math.abs(v);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-6)) return v.toExponential(4).replace('e', 'E');
  const r = Math.round(v * 1e9) / 1e9;
  let s = String(r);
  if (s.indexOf('e') >= 0) return v.toExponential(4).replace('e', 'E');
  const dot = s.indexOf('.');
  let intPart = dot >= 0 ? s.slice(0, dot) : s;
  const dec = dot >= 0 ? s.slice(dot + 1).replace(/0+$/, '') : '';
  let sign = '';
  if (intPart.charAt(0) === '-') {
    sign = '-';
    intPart = intPart.slice(1);
  }
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return sign + grouped + (dec ? ',' + dec : '');
}

export function plainNum(v: number): string {
  if (!isFinite(v)) return '';
  return String(Math.round(v * 1e10) / 1e10);
}

export const EMPTY_ENV: Env = {
  cell: () => er('#REF!'),
  range: () => [er('#REF!')],
};
