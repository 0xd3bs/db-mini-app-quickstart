"use client";

import { useMemo } from "react";
import Link from "next/link";
import { computeConsistencyRatio, computeWeightsGeometricMean, createReciprocalMatrix, multiplyMatrixVector, type Matrix } from "@/lib/ahp";
import { toSaatyFromStep, toStepFromSaaty } from "@/lib/scale";

type TestResult = { name: string; pass: boolean; details?: string };

function approx(a: number, b: number, eps = 1e-6) {
  return Math.abs(a - b) <= eps;
}

function normalize(v: number[]) {
  const s = v.reduce((a, b) => a + b, 0);
  return v.map(x => (s > 0 ? x / s : 0));
}

export default function VerifyPage() {
  const results = useMemo<TestResult[]>(() => {
    const out: TestResult[] = [];

    // T0: Scale mapping round-trip
    {
      let ok = true;
      for (let s = -8; s <= 8; s++) {
        const v = toSaatyFromStep(s);
        const s2 = toStepFromSaaty(v);
        if (s !== s2) { ok = false; break; }
      }
      out.push({ name: "Escala step ↔ Saaty es biyectiva en valores discretos", pass: ok });
    }

    // T1: Matrix reciprocity
    {
      const m = createReciprocalMatrix(3);
      m[0][1] = 3; m[1][0] = 1/3;
      m[0][2] = 5; m[2][0] = 1/5;
      m[1][2] = 7; m[2][1] = 1/7;
      let ok = true;
      for (let i = 0; i < 3; i++) {
        if (!approx(m[i][i], 1)) { ok = false; break; }
        for (let j = 0; j < 3; j++) {
          if (!approx(m[i][j] * m[j][i], 1)) { ok = false; break; }
        }
      }
      out.push({ name: "Matriz recíproca válida (a_ij * a_ji = 1, a_ii = 1)", pass: ok });
    }

    // T2: Consistent triad weights and CR
    {
      const w = [9, 3, 1];
      const n = w.length;
      const m: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => w[i] / w[j]));
      const est = computeWeightsGeometricMean(m);
      const estN = normalize(est);
      const wN = normalize(w);
      const okW = estN.every((x, i) => approx(x, wN[i], 1e-4));
      const { CR } = computeConsistencyRatio(m, est);
      const okCR = CR < 1e-4;
      out.push({ name: "Triada consistente: pesos y CR≈0", pass: okW && okCR, details: `CR=${CR.toExponential(2)}` });
    }

    // T3: Permutación no cambia los pesos relativos
    {
      const w = [5, 2, 1, 0.5];
      const n = w.length;
      const m: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => w[i] / w[j]));
      const base = normalize(computeWeightsGeometricMean(m));
      const p = [2, 0, 3, 1]; // permutación
      const mp: Matrix = Array.from({ length: n }, (_, ii) => Array.from({ length: n }, (_, jj) => w[p[ii]] / w[p[jj]]));
      const ep = normalize(computeWeightsGeometricMean(mp));
      // des‑permuta para comparar en el orden original
      const unperm = new Array(n).fill(0);
      for (let ii = 0; ii < n; ii++) {
        unperm[p[ii]] = ep[ii];
      }
      const ok = base.every((x, i) => approx(x, unperm[i], 1e-4));
      out.push({ name: "Invarianza por reordenamiento de opciones", pass: ok });
    }

    // T4: 4 opciones consistentes
    {
      const w = [8, 4, 2, 1];
      const n = w.length;
      const m: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => w[i] / w[j]));
      const est = computeWeightsGeometricMean(m);
      const { CR } = computeConsistencyRatio(m, est);
      out.push({ name: "Consistencia con 4 opciones (CR≈0)", pass: CR < 1e-4, details: `CR=${CR.toExponential(2)}` });
    }

    // T5: Lambda property sanity (Aw ~ lambda*w)
    {
      const w = [9, 3, 1];
      const n = w.length;
      const m: Matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => w[i] / w[j]));
      const est = normalize(computeWeightsGeometricMean(m));
      const Aw = multiplyMatrixVector(m, est);
      // Para matriz consistente, lambda_max = n
      const ratios = Aw.map((x, i) => x / est[i]);
      const ok = ratios.every(r => approx(r, n, 1e-4));
      out.push({ name: "Propiedad eigen (λmax = n en consistente)", pass: ok });
    }

    return out;
  }, []);

  const allPass = results.every(r => r.pass);

  return (
    <div className="stack-lg">
      <header className="stack-sm">
        <h1>Verificación AHP</h1>
        <p className="muted">Pruebas internas para confirmar la correcta aplicación de la escala de Saaty y el cálculo de pesos/consistencia.</p>
      </header>

      <section className="card stack-sm">
        <h2>Resultados</h2>
        <ul className="stack-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {results.map((r) => (
            <li key={r.name} className="row between">
              <span>{r.name}{r.details ? ` — ${r.details}` : ""}</span>
              <span className="badge" style={{ background: r.pass ? "#113d2b" : "#3d1111", borderColor: r.pass ? "#1f6f4b" : "#6f1f1f" }}>{r.pass ? "PASS" : "FAIL"}</span>
            </li>
          ))}
        </ul>
        <p className="hint">{allPass ? "Todo correcto: la implementación AHP cumple las propiedades esperadas." : "Hay fallos: revisa detalles y contacta para depuración."}</p>
      </section>

      <footer className="footer">
        <Link href="/" className="btn ghost">Volver</Link>
      </footer>
    </div>
  );
}
