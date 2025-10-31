export function toSaatyFromStep(s: number): number {
  if (s === 0) return 1;
  if (s > 0) return s + 1; // 2..9
  const mag = Math.abs(s) + 1; // 2..9
  return 1 / mag; // 1/2..1/9
}

export function toStepFromSaaty(v: number): number {
  if (Math.abs(v - 1) < 1e-9) return 0;
  if (v > 1) return Math.round(v - 1); // 1->0, 2->1 ... 9->8
  const inv = 1 / v; // 2..9
  return -Math.round(inv - 1); // 2->-1 ... 9->-8
}

export function degreeLabelFromStep(s: number) {
  const a = Math.abs(s) + 1; // 1..9
  switch (a) {
    case 2: return "ligeramente";
    case 3: return "moderadamente";
    case 4: return "entre ligera y moderada";
    case 5: return "fuertemente";
    case 6: return "entre moderada y fuerte";
    case 7: return "muy fuertemente";
    case 8: return "entre fuerte y extrema";
    case 9: return "extremadamente";
    default: return "igual";
  }
}
