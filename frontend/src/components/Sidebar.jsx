import { useEffect, useRef, useState } from "react";
import { useDashPalette } from "../hooks/useDashPalette";
import {
  IconAlertTriangle,
  IconBarChart,
  IconBook,
  IconLayers,
  IconLayoutDashboard,
  IconRadio,
  IconSend,
  IconSettings,
  IconUsers,
} from "./icons";

const NAV = [
  { id: "dashboard", label: "Dashboard", Icon: IconLayoutDashboard },
  { id: "topics", label: "Topics", Icon: IconLayers },
  { id: "producer", label: "Producer", Icon: IconSend },
  { id: "consumers", label: "Consumers", Icon: IconUsers },
  { id: "live-stream", label: "Live Stream", Icon: IconRadio },
  { id: "dlq", label: "Dead Letter Queue", Icon: IconAlertTriangle },
  { id: "metrics", label: "Metrics", Icon: IconBarChart },
  { id: "settings", label: "Settings", Icon: IconSettings },
  { id: "documentation", label: "Documentation", Icon: IconBook },
];

/** Mini sparkline — static curve reads as “healthy” without extra API calls */
function SparklineHealthy() {
  const pts = "0,14 20,10 40,12 60,6 80,9 100,4";
  return (
    <svg viewBox="0 0 100 18" className="h-8 w-full text-emerald-400/90" aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(52 211 153)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(52 211 153)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#spark-fill)" points={`0,18 ${pts} 100,18`} />
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function formatUptime(ms) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function Sidebar({ active, onNavigate, mobileOpen, setMobileOpen }) {
  const p = useDashPalette();
  const [uptime, setUptime] = useState("0h 00m 00s");
  const mountedAt = useRef(null);

  useEffect(() => {
    mountedAt.current = Date.now();
    const tick = () => setUptime(formatUptime(Date.now() - mountedAt.current));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-[2px] md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed bottom-0 left-0 top-14 z-30 flex w-60 transform flex-col border-r shadow-xl transition-transform duration-200 ease-out md:static md:z-0 md:min-h-[calc(100dvh-3.5rem)] md:w-60 md:translate-x-0 md:shadow-none ${p.sidebar} ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 pt-4 md:pt-3">
          {NAV.map((item) => {
            const Icon = item.Icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${isActive ? p.sidebarNavActive : p.sidebarNavIdle
                  }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : p.sidebarIconIdle}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`border-t p-3 ${p.sidebarFooterDivider}`}>
          <div className={p.sidebarStatusCard}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#34d399]" />
                </span>
                <span className={`text-xs font-semibold ${p.sidebarStatusTitle}`}>System Status</span>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                Healthy
              </span>
            </div>
            <div className={`mt-2 overflow-hidden rounded-lg px-1 ${p.sidebarSparklineBg}`}>
              <SparklineHealthy />
            </div>
            <p className={`mt-2 text-[11px] ${p.sidebarUptime}`}>
              Uptime: <span className={`font-mono ${p.sidebarUptimeMono}`}>{uptime}</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
