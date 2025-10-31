"use client";

import { useMemo } from "react";
import { degreeLabelFromStep, toSaatyFromStep, toStepFromSaaty } from "@/lib/scale";

type Props = {
  left: string;
  right: string;
  value: number; // Saaty value (1/9..1..9)
  onChange: (v: number) => void;
};

export default function PairControl({ left, right, value, onChange }: Props) {
  const step = useMemo(() => toStepFromSaaty(value), [value]);

  const label = useMemo(() => {
    if (step === 0) return `Igual importancia`;
    const side = step > 0 ? left : right;
    const saaty = step > 0 ? step + 1 : `1/${Math.abs(step) + 1}`;
    return `${side} ${degreeLabelFromStep(step)} (${saaty})`;
  }, [left, right, step]);

  const setStep = (s: number) => {
    const clamped = Math.max(-8, Math.min(8, s));
    onChange(toSaatyFromStep(clamped));
  };

  const increment = (d: number) => setStep(step + d);
  const invert = () => setStep(-step);

  return (
    <div className="pair-ctl stack-sm" role="group" aria-label={`Preferencia entre ${left} y ${right}`}>
      <div className="pair-legend">
        <span className="truncate" title={left}>{left}</span>
        <span className="muted mono">{label}</span>
        <span className="truncate" title={right}>{right}</span>
      </div>

      <div className="row">
        <button type="button" className="btn stepper" aria-label="Disminuir" onClick={() => increment(-1)}>−</button>
        <input
          className="slider"
          type="range"
          min={-8}
          max={8}
          step={1}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          aria-valuemin={-8}
          aria-valuemax={8}
          aria-valuenow={step}
        />
        <button type="button" className="btn stepper" aria-label="Aumentar" onClick={() => increment(1)}>+</button>
      </div>

      <div className="row chips">
        <button type="button" className="chip" onClick={() => setStep(0)}>Igual</button>
        <button type="button" className="chip" onClick={() => setStep(step === 0 ? 2 : Math.sign(step) * 2)}>Ligeramente</button>
        <button type="button" className="chip" onClick={() => setStep(step === 0 ? 4 : Math.sign(step) * 4)}>Moderadamente</button>
        <button type="button" className="chip" onClick={() => setStep(step === 0 ? 6 : Math.sign(step) * 6)}>Fuertemente</button>
        <button type="button" className="chip" onClick={() => setStep(step === 0 ? 8 : Math.sign(step) * 8)}>Extremadamente</button>
        <button type="button" className="btn ghost" onClick={invert} aria-label="Invertir preferencia">Invertir</button>
      </div>
    </div>
  );
}
