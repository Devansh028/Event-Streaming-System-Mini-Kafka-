import { useId } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDashPalette } from "../hooks/useDashPalette";
import { IconBarChart } from "./icons";

function TrendRow({ trend, mutedClass, isLight }) {
  if (!trend || trend.pct == null || Number.isNaN(trend.pct)) {
    return <span className={`text-[10px] ${mutedClass}`}>—</span>;
  }
  const { pct, good, flat } = trend;
  if (flat) {
    return (
      <span className={`text-[10px] ${isLight ? "text-slate-500" : "text-gray-500"}`}>flat</span>
    );
  }
  const isUp = pct > 0;
  return (
    <span
      className={`text-[10px] font-semibold ${good ? "text-emerald-400" : "text-rose-400"}`}
      title="vs previous sample"
    >
      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function StatBlock({ label, value, valueClass, trend, hint, cardClass, labelClass, hintClass, trendMutedClass, isLight }) {
  return (
    <div
      className={`flex min-w-0 flex-col rounded-xl border p-3.5 shadow-inner transition hover:border-gray-700 ${cardClass}`}
    >
      <p className={`text-[10px] font-bold uppercase tracking-wide ${labelClass}`}>{label}</p>
      {hint ? <p className={`text-[9px] ${hintClass}`}>{hint}</p> : null}
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className={`truncate text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
        <TrendRow trend={trend} mutedClass={trendMutedClass} isLight={isLight} />
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.metrics
 * @param {number} props.eventsPerSecond
 * @param {Array} props.chartData
 * @param {Array} [props.epsChartData]
 * @param {object} [props.trends] keyed like metrics
 * @param {'full' | 'dashboard'} [props.variant]
 */
function Metrics({ metrics, eventsPerSecond, chartData, epsChartData = [], trends = null, variant = "full" }) {
  const p = useDashPalette();
  const chartUid = useId().replace(/:/g, "");
  const m = metrics || {};
  const t = trends || {};
  const epsSeries = Array.isArray(epsChartData) && epsChartData.length ? epsChartData : [{ time: "—", eps: 0 }];

  const totalVal = m.totalEvents ?? 0;
  const procVal = m.processedEvents ?? 0;
  const failVal = m.failedEvents ?? 0;
  const dlqVal = m.dlqCount ?? 0;
  const epsVal =
    m.eventsPerSecond != null ? Number(m.eventsPerSecond).toFixed(2) : String(eventsPerSecond ?? 0);

  const cardClass = p.statCard;
  const labelClass = p.statLabel;
  const hintClass = p.statHint;
  const trendMutedClass = p.trendMuted;

  const tipStyle = {
    background: p.isLight ? "#ffffff" : "#111827",
    border: p.isLight ? "1px solid #e2e8f0" : "1px solid #374151",
    borderRadius: "12px",
    fontSize: "12px",
    color: p.isLight ? "#0f172a" : "#e5e7eb",
  };

  const axisMuted = p.isLight ? "#64748b" : "#9ca3af";
  const axisLine = p.isLight ? "#cbd5e1" : "#374151";

  const statGrid = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatBlock
        label="Total Events"
        value={totalVal}
        valueClass={p.isLight ? "text-slate-900" : "text-white"}
        trend={t.totalEvents}
        hint="all time"
        cardClass={cardClass}
        labelClass={labelClass}
        hintClass={hintClass}
        trendMutedClass={trendMutedClass}
        isLight={p.isLight}
      />
      <StatBlock
        label="Processed"
        value={procVal}
        valueClass="text-emerald-400"
        trend={t.processedEvents}
        hint="stored"
        cardClass={cardClass}
        labelClass={labelClass}
        hintClass={hintClass}
        trendMutedClass={trendMutedClass}
        isLight={p.isLight}
      />
      <StatBlock
        label="Failed"
        value={failVal}
        valueClass="text-rose-400"
        trend={t.failedEvents}
        hint="errors"
        cardClass={cardClass}
        labelClass={labelClass}
        hintClass={hintClass}
        trendMutedClass={trendMutedClass}
        isLight={p.isLight}
      />
      <StatBlock
        label="DLQ count"
        value={dlqVal}
        valueClass="text-amber-300"
        trend={t.dlqCount}
        hint="stream"
        cardClass={cardClass}
        labelClass={labelClass}
        hintClass={hintClass}
        trendMutedClass={trendMutedClass}
        isLight={p.isLight}
      />
      <StatBlock
        label="Events / sec"
        value={epsVal}
        valueClass="text-violet-300"
        trend={t.eventsPerSecond}
        hint="from API"
        cardClass={cardClass}
        labelClass={labelClass}
        hintClass={hintClass}
        trendMutedClass={trendMutedClass}
        isLight={p.isLight}
      />
    </div>
  );

  const gradId = `line-grad-${chartUid}`;
  const glowId = `line-glow-${chartUid}`;

  const chartEps = (
    <div className="h-64 min-h-[14rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={epsSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <XAxis dataKey="time" tick={{ fill: axisMuted, fontSize: 10 }} axisLine={{ stroke: axisLine }} tickLine={false} />
          <YAxis tick={{ fill: axisMuted, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, "auto"]} width={28} />
          <Tooltip contentStyle={tipStyle} labelStyle={{ color: p.isLight ? "#0f172a" : "#e5e7eb" }} />
          <Line
            type="monotone"
            dataKey="eps"
            stroke={`url(#${gradId})`}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#c4b5fd", stroke: "#4f46e5" }}
            filter={`url(#${glowId})`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const chartSession = (
    <div className="h-56 min-h-[12rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="time" tick={{ fill: axisMuted, fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fill: axisMuted, fontSize: 11 }} width={28} />
          <Tooltip contentStyle={tipStyle} />
          <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  if (variant === "dashboard") {
    return (
      <section className={p.panel}>
        <div className={`flex items-center gap-3 border-b px-5 py-4 ${p.panelHeaderBorder}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/25 ring-1 ring-violet-500/25">
            <IconBarChart className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold tracking-tight ${p.panelTitle}`}>System Metrics</h2>
            <p className={`text-[11px] ${p.panelMuted}`}>Counts + rate · polled every 5s</p>
          </div>
        </div>
        <div className="space-y-4 p-5 pt-4">
          {statGrid}
          <div>
            <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${p.label}`}>
              Events / sec (API sample)
            </p>
            {chartEps}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {statGrid}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`rounded-xl border p-4 shadow-lg ${p.chartCard}`}>
          <p className={`mb-1 text-[11px] font-medium uppercase tracking-wide ${p.label}`}>Throughput (session)</p>
          <p className={`mb-3 text-xs ${p.chartHelp}`}>Events / second in this browser (last ~20s)</p>
          {chartSession}
        </div>
        <div className={`rounded-xl border p-4 shadow-lg ${p.chartCard}`}>
          <p className={`mb-1 text-[11px] font-medium uppercase tracking-wide ${p.label}`}>API publish rate</p>
          <p className={`mb-3 text-xs ${p.chartHelp}`}>events/sec from /api/metrics (sampled)</p>
          {chartEps}
        </div>
      </div>
    </section>
  );
}

export default Metrics;
