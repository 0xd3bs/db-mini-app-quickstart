"use client";

import { useEffect, useMemo, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { buildPairIndex, computeConsistencyRatio, computeWeightsGeometricMean, createReciprocalMatrix, Pair, RI_VALUES } from "@/lib/ahp";
import { toSaatyFromStep, toStepFromSaaty } from "@/lib/scale";
import PairControl from "@/components/PairControl";
import BottomSheet from "@/components/BottomSheet";
import ThemeToggle from "@/components/ThemeToggle";
import { encodeStateToUrlParam, decodeStateFromUrlParam } from "@/lib/state";

type ComparisonValue = number; // Saaty value including reciprocals

export default function HomePage() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { composeCastAsync } = useComposeCast();

  const [goal, setGoal] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["Opción A", "Opción B", "Opción C"]);

  const pairs: Pair[] = useMemo(() => {
    const list: Pair[] = [];
    for (let i = 0; i < options.length; i++) {
      for (let j = i + 1; j < options.length; j++) {
        list.push({ i, j });
      }
    }
    return list;
  }, [options.length]);

  const [values, setValues] = useState<Record<string, ComparisonValue>>({});
  const [pairIndex, setPairIndex] = useState<number>(0);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const [shareOpen, setShareOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [importText, setImportText] = useState<string>("");

  const matrix = useMemo(() => {
    const n = options.length;
    const m = createReciprocalMatrix(n);
    for (const p of pairs) {
      const key = buildPairIndex(p.i, p.j);
      const v = values[key];
      if (typeof v === "number" && isFinite(v) && v > 0) {
        m[p.i][p.j] = v;
        m[p.j][p.i] = 1 / v;
      }
    }
    return m;
  }, [pairs, values, options.length]);

  const weights = useMemo(() => {
    if (options.length < 2) return [] as number[];
    return computeWeightsGeometricMean(matrix);
  }, [matrix, options.length]);

  const consistency = useMemo(() => {
    const n = options.length;
    if (n < 3) return { lambdaMax: NaN, CI: 0, CR: 0 };
    return computeConsistencyRatio(matrix, weights);
  }, [matrix, weights, options.length]);

  const conflicts = useMemo(() => {
    if (weights.length !== options.length) return [] as Array<{ i:number; j:number; dev:number; expected:number; actual:number; left:string; right:string; pairIdx:number }>;
    const list = pairs.map(({ i, j }, idx) => {
      const actual = matrix[i][j];
      const expected = weights[i] / weights[j];
      const dev = Math.abs(Math.log(actual) - Math.log(expected));
      return { i, j, dev, expected, actual, left: options[i] ?? `Opción ${i+1}`, right: options[j] ?? `Opción ${j+1}`, pairIdx: idx };
    }).sort((a, b) => b.dev - a.dev);
    return list;
  }, [pairs, matrix, weights, options]);

  const handleAddOption = () => {
    setOptions(prev => [...prev, `Opción ${String.fromCharCode(65 + prev.length)}`]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter((_, i) => i !== idx));
    setValues({}); // reset comparisons to avoid misalignment
  };

  const setPairValue = (i: number, j: number, raw: string | number) => {
    const key = buildPairIndex(i, j);
    const v = Number(raw);
    if (!isFinite(v) || v <= 0) return;
    setValues(prev => ({ ...prev, [key]: v }));
  };

  // Initialize MiniKit
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Load state only from URL parameter (for sharing), NOT from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const s = url.searchParams.get("s");
      if (s) {
        const state = decodeStateFromUrlParam(s);
        if (state) {
          setGoal(state.goal ?? "");
          setOptions(state.options);
          setValues(state.values ?? {});
          setPairIndex(Math.max(0, Math.min(state.pairIndex ?? 0, Math.max(0, (state.options.length * (state.options.length - 1)) / 2 - 1))));
          url.searchParams.delete("s");
          window.history.replaceState({}, "", url.toString());
        }
      }
    } catch {}
  }, []);

  // Farcaster sharing handlers
  const handleShareInvitation = async () => {
    try {
      const text = `I just used Saaty AHP to make a better decision! Try it yourself: `;

      const result = await composeCastAsync({
        text: text,
        embeds: [process.env.NEXT_PUBLIC_URL || window.location.origin]
      });

      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
    }
  };

  const handleShareResults = async () => {
    try {
      // Get winning option (highest weight)
      const rankedOptions = weights
        .map((w, i) => ({ name: options[i], weight: w }))
        .sort((a, b) => b.weight - a.weight);

      const winner = rankedOptions[0];

      // SIMPLIFIED TEXT - matching button 1 format exactly (no special chars, quotes, or complex formatting)
      const text = `I just completed an AHP analysis and the winner is ${winner.name}! Try it yourself: `;

      // CLEAN URL without query params (same as invitation button for TBA compatibility)
      const shareLink = process.env.NEXT_PUBLIC_URL || window.location.origin;

      // Debug logging
      console.log('=== Share Debug Info ===');
      console.log('Text length:', text.length);
      console.log('Text:', text);
      console.log('URL:', shareLink);
      console.log('URL length:', shareLink.length);

      const result = await composeCastAsync({
        text: text,
        embeds: [shareLink]
      });

      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    }
  };

  return (
    <div className="stack-lg">
      <header className="stack-sm">
        <h1>AHP · Escala de Saaty</h1>
        <p className="muted">Compara opciones por pares para estimar su importancia relativa y tomar mejores decisiones.</p>
      </header>

      <section className="card stack-sm">
        <label className="label">Objetivo</label>
        <input
          className="input"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="¿Cuál es tu objetivo o decisión?"
          aria-label="Objetivo o decisión"
        />

        <div className="stack-sm">
          <label className="label">Opciones</label>
          <ul className="stack-xs">
            {options.map((opt, idx) => (
              <li key={idx} className="row">
                <input
                  className="input flex-1"
                  value={opt}
                  onChange={(e) => {
                    const v = e.target.value;
                    setOptions(prev => prev.map((p, i) => (i === idx ? v : p)));
                  }}
                  aria-label={`Nombre de la opción ${idx + 1}`}
                />
                <button
                  className="btn ghost"
                  onClick={() => handleRemoveOption(idx)}
                  aria-label={`Eliminar opción ${idx + 1}`}
                  disabled={options.length <= 2}
                  title={options.length <= 2 ? "Debe haber al menos 2 opciones" : "Eliminar opción"}
                >
                  −
                </button>
              </li>
            ))}
          </ul>
          <button className="btn" onClick={handleAddOption}>Agregar opción</button>
        </div>
      </section>

      <section className="card stack-sm">
        <h2>Comparaciones por pares</h2>
        {pairs.length === 0 ? (
          <p className="muted">Agrega más opciones para comparar.</p>
        ) : (
          <div className="stack-sm">
            {(() => {
              const { i, j } = pairs[Math.min(pairIndex, pairs.length - 1)];
              const left = options[i] ?? `Opción ${i + 1}`;
              const right = options[j] ?? `Opción ${j + 1}`;
              const key = buildPairIndex(i, j);
              const current = values[key] ?? 1;
              const onTouchNav: React.TouchEventHandler<HTMLDivElement> = (() => {
                let startX = 0;
                return (e) => {
                  if (e.type === "touchstart") startX = e.touches[0].clientX;
                  if (e.type === "touchend") {
                    const touchEvent = e as React.TouchEvent<HTMLDivElement>;
                    const dx = touchEvent.changedTouches?.[0]?.clientX - startX;
                    if (dx > 50) setPairIndex(p => Math.max(0, p - 1));
                    if (dx < -50) setPairIndex(p => Math.min(pairs.length - 1, p + 1));
                  }
                };
              })();
              return (
                <div onTouchStart={onTouchNav} onTouchEnd={onTouchNav}>
                  <PairControl
                  left={left}
                  right={right}
                  value={current}
                  onChange={(v) => setPairValue(i, j, v)}
                  />
                </div>
              );
            })()}

            <p className="help">
              Usa el control para indicar qué opción es más importante y en qué grado. La escala va de 1/9 a 9.
            </p>
          </div>
        )}
      </section>

      <section className="card stack-sm">
        <h2>Resultados</h2>
        {weights.length === options.length ? (
          <div className="stack-sm">
            <ol className="weights">
              {weights
                .map((w, i) => ({ name: options[i], w }))
                .sort((a, b) => b.w - a.w)
                .map(({ name, w }, rank) => (
                  <li key={name} className="row">
                    <span className="badge">{rank + 1}</span>
                    <span className="flex-1 truncate" title={name}>{name}</span>
                    <span className="mono">{(w * 100).toFixed(2)}%</span>
                  </li>
                ))}
            </ol>

            {Number.isFinite(consistency.CR) && options.length >= 3 && (
              <div className="consistency">
                <div><span className="muted">CR</span> <strong>{(consistency.CR * 100).toFixed(2)}%</strong></div>
                <div><span className="muted">CI</span> <span className="mono">{consistency.CI.toFixed(4)}</span></div>
                <div><span className="muted">λmax</span> <span className="mono">{consistency.lambdaMax.toFixed(4)}</span></div>
                <div className="muted">RI (n={options.length}) = {RI_VALUES[options.length] ?? "—"}</div>
                <p className="hint">
                  {consistency.CR < 0.1 ? "Consistencia aceptable (CR < 10%)." : "Advertencia: la consistencia es baja (CR ≥ 10%). Revisa comparaciones."}
                </p>
              </div>
            )}

            {/* Farcaster Share Buttons - shown after calculating weights */}
            <div className="row" style={{ gap: "var(--space-sm)", marginTop: "var(--space-sm)" }}>
              <button className="btn secondary" onClick={handleShareInvitation}>
                Compartir invitación
              </button>
              <button className="btn" onClick={handleShareResults}>
                Compartir resultados
              </button>
            </div>

            {consistency.CR >= 0.1 && conflicts.length > 0 && (
              <div className="card stack-sm" style={{ background: "transparent" }}>
                <h3>Pares a revisar</h3>
                <ul className="conflicts">
                  {conflicts.slice(0, 3).map((c) => {
                    const step = toStepFromSaaty(c.expected);
                    const approx = toSaatyFromStep(step);
                    const trend = step === 0 ? "Igual" : step > 0 ? `${c.left}` : `${c.right}`;
                    return (
                      <li key={`${c.i}-${c.j}`} className="row between">
                        <div className="flex-1 truncate" title={`${c.left} vs ${c.right}`}>
                          <strong>{c.left}</strong> vs <strong>{c.right}</strong>
                          <div className="muted" style={{ fontSize: ".9em" }}>Esperado: {trend} (~{Number.isInteger(approx) ? approx : `1/${Math.round(1/approx)}`})</div>
                        </div>
                        <button className="btn ghost" onClick={() => setPairIndex(c.pairIdx)}>Ir</button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="muted">Completa las comparaciones para ver los pesos.</p>
        )}
      </section>

      <footer className="sticky-footer" aria-label="Controles de navegación">
        <div className="sticky-grid">
          <div>
            <div className="row between">
              <span className="muted">Par {Math.min(pairIndex + 1, pairs.length)} de {pairs.length}</span>
              <span className="muted">CR {(consistency.CR * 100).toFixed(1)}%</span>
            </div>
            <div className="progressbar" aria-hidden="true"><span style={{ width: pairs.length ? `${((pairIndex+1)/pairs.length)*100}%` : "0%" }} /></div>
          </div>
          <div className="row">
            <button className="btn ghost" onClick={() => setPairIndex(i => Math.max(0, i - 1))} disabled={pairIndex === 0}>Anterior</button>
            <button className="btn ghost" onClick={() => {
              const state = { goal, options, values, pairIndex };
              const s = encodeStateToUrlParam(state);
              const url = `${window.location.origin}?s=${s}`;
              setShareUrl(url);
              setShareOpen(true);
            }}>Compartir</button>
          </div>
          <div className="row" style={{ gap: "var(--space-xs)" }}>
            {consistency.CR >= 0.1 && conflicts.length > 0 && (
              <button className="btn secondary" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">Revisar ({Math.min(3, conflicts.length)})</button>
            )}
            <button className="btn" onClick={() => setPairIndex(i => Math.min(pairs.length - 1, i + 1))} disabled={pairIndex >= pairs.length - 1}>Siguiente</button>
          </div>
        </div>
        <div className="row between" style={{ marginTop: "var(--space-xs)" }}>
          <small className="muted">AHP · Escala de Saaty</small>
          <div className="row" style={{ gap: "var(--space-xs)" }}>
            <a className="btn ghost" href="/verify">Verificar AHP</a>
            <ThemeToggle />
          </div>
        </div>
      </footer>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Pares a revisar">
        {consistency.CR < 0.1 || conflicts.length === 0 ? (
          <p className="muted">No hay pares prioritarios. La consistencia es aceptable.</p>
        ) : (
          <ul className="conflicts">
            {conflicts.slice(0, 6).map((c) => {
              const step = toStepFromSaaty(c.expected);
              const approx = toSaatyFromStep(step);
              const trend = step === 0 ? "Igual" : step > 0 ? `${c.left}` : `${c.right}`;
              return (
                <li key={`${c.i}-${c.j}`} className="row between">
                  <div className="flex-1 truncate" title={`${c.left} vs ${c.right}`}>
                    <strong>{c.left}</strong> vs <strong>{c.right}</strong>
                    <div className="muted" style={{ fontSize: ".9em" }}>Esperado: {trend} (~{Number.isInteger(approx) ? approx : `1/${Math.round(1/approx)}`})</div>
                  </div>
                  <button className="btn ghost" onClick={() => { setPairIndex(c.pairIdx); setSheetOpen(false); }}>Ir</button>
                </li>
              );
            })}
          </ul>
        )}
      </BottomSheet>

      <BottomSheet open={shareOpen} onClose={() => setShareOpen(false)} title="Compartir / Importar">
        <div className="stack-sm">
          <label className="label">Enlace</label>
          <div className="row">
            <input className="input flex-1" readOnly value={shareUrl} />
            <button className="btn ghost" onClick={async () => { try { await navigator.clipboard.writeText(shareUrl); } catch {} }}>Copiar</button>
          </div>

          <label className="label">Exportar JSON</label>
          <textarea className="input" readOnly value={JSON.stringify({ goal, options, values, pairIndex }, null, 2)} />

          <label className="label">Importar JSON</label>
          <textarea className="input" placeholder="Pega el JSON aquí" value={importText} onChange={(e) => setImportText(e.target.value)} />
          <div className="row">
            <button className="btn secondary" onClick={() => setImportText("")}>Limpiar</button>
            <button className="btn" onClick={() => {
              try {
                const st = JSON.parse(importText) as { goal:string; options:string[]; values: Record<string, number>; pairIndex:number };
                if (Array.isArray(st.options) && st.options.length >= 2) {
                  setGoal(st.goal ?? "");
                  setOptions(st.options);
                  setValues(st.values ?? {});
                  setPairIndex(Math.max(0, Math.min(st.pairIndex ?? 0, Math.max(0, (st.options.length * (st.options.length - 1)) / 2 - 1))));
                  setShareOpen(false);
                }
              } catch {}
            }}>Cargar</button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
