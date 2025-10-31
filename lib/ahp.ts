export type Matrix = number[][];
export type Pair = { i: number; j: number };

export function buildPairIndex(i: number, j: number) {
  return `${i}-${j}`;
}

export function createReciprocalMatrix(n: number): Matrix {
  const m: Matrix = Array.from({ length: n }, () => Array(n).fill(1));
  for (let i = 0; i < n; i++) {
    m[i][i] = 1;
  }
  return m;
}

export function computeWeightsGeometricMean(m: Matrix): number[] {
  const n = m.length;
  if (n === 0) return [];
  const gm = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let prod = 1;
    for (let j = 0; j < n; j++) {
      const v = m[i][j];
      prod *= v > 0 ? v : 1; // safety
    }
    gm[i] = Math.pow(prod, 1 / n);
  }
  const sum = gm.reduce((a, b) => a + b, 0);
  return gm.map(x => (sum > 0 ? x / sum : 0));
}

export function multiplyMatrixVector(m: Matrix, v: number[]): number[] {
  const n = m.length;
  const out = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += m[i][j] * v[j];
    out[i] = s;
  }
  return out;
}

export function computeLambdaMax(m: Matrix, w: number[]): number {
  const n = m.length;
  const Aw = multiplyMatrixVector(m, w);
  let sum = 0;
  for (let i = 0; i < n; i++) {
    if (w[i] === 0) continue;
    sum += Aw[i] / w[i];
  }
  return sum / n;
}

export const RI_VALUES: Record<number, number> = {
  1: 0.0,
  2: 0.0,
  3: 0.58,
  4: 0.90,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49
};

export function computeConsistencyRatio(m: Matrix, w: number[]) {
  const n = m.length;
  const lambdaMax = computeLambdaMax(m, w);
  const CI = (lambdaMax - n) / (n - 1);
  const RI = RI_VALUES[n] ?? 1.49; // fallback for n>10
  const CR = RI === 0 ? 0 : CI / RI;
  return { lambdaMax, CI, CR };
}
