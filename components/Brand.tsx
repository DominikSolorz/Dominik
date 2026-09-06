export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="DS Stream Support">
      <span className="brandMark">DS</span>
      {compact ? null : <span className="brandText">Stream Support</span>}
    </div>
  );
}
