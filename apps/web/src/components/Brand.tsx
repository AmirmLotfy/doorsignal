export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="brand"><span className="brand-icon" aria-hidden="true"><span /></span>{!compact && <span>DoorSignal<span className="brand-period">.</span></span>}</span>;
}
