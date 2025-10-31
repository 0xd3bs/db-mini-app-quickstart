"use client";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function BottomSheet({ open, title, onClose, children }: Props) {
  return (
    <div aria-hidden={!open} className={`sheet ${open ? "open" : ""}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel" role="dialog" aria-modal="true" aria-label={title || "Panel"}>
        <div className="sheet-header">
          <strong>{title}</strong>
          <button className="btn ghost" onClick={onClose} aria-label="Cerrar">Cerrar</button>
        </div>
        <div className="sheet-body">
          {children}
        </div>
      </div>
    </div>
  );
}
