export default function Sparkline({ data, dataKey, className = "", stroke = "currentColor" }) {
  const values = data.map((item) => item[dataKey]).filter((value) => Number.isFinite(value));
  if (values.length < 2) return <div className={`h-8 rounded-lg bg-slate-50 ${className}`} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 32 - ((value - min) / range) * 28 - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className={`h-8 w-full overflow-visible ${className}`} viewBox="0 0 100 34" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
