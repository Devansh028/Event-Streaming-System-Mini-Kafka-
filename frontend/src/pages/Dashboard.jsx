import { useEffect, useMemo, useRef, useState } from "react";
import DLQ from "../components/DLQ";
import EventTrigger from "../components/EventTrigger";
import HeaderBar from "../components/HeaderBar";
import LiveStream from "../components/LiveStream";
import Metrics from "../components/Metrics";
import ProducerConsole from "../components/ProducerConsole";
import ProducerPanel from "../components/ProducerPanel";
import Sidebar from "../components/Sidebar";
import Topics from "../components/Topics";
import { ThemeProvider } from "../context/ThemeProvider";
import { useDashPalette } from "../hooks/useDashPalette";
import api from "../services/api";
import socket from "../services/socket";

function computeMetricTrends(prev, next) {
  if (!prev || !next) {
    return {};
  }

  const deltaPct = (a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isNaN(na) || Number.isNaN(nb)) {
      return null;
    }
    if (Math.abs(nb) < 1e-9) {
      if (Math.abs(na) < 1e-9) {
        return 0;
      }
      return null;
    }
    return ((na - nb) / Math.abs(nb)) * 100;
  };

  const make = (key, higherIsBetter) => {
    const pct = deltaPct(next[key], prev[key]);
    if (pct === null || Number.isNaN(pct)) {
      return null;
    }
    if (Math.abs(pct) < 0.05) {
      return { pct: 0, good: true, flat: true };
    }
    const up = pct > 0;
    const good = higherIsBetter ? up : !up;
    return { pct, good, flat: false };
  };

  return {
    totalEvents: make("totalEvents", true),
    processedEvents: make("processedEvents", true),
    failedEvents: make("failedEvents", false),
    dlqCount: make("dlqCount", false),
    eventsPerSecond: make("eventsPerSecond", true),
  };
}

function DashboardShell() {
  const p = useDashPalette();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [serverMetrics, setServerMetrics] = useState({
    totalEvents: 0,
    processedEvents: 0,
    failedEvents: 0,
    dlqCount: 0,
    eventsPerSecond: 0,
  });
  const [epsChartData, setEpsChartData] = useState([]);
  const [metricTrends, setMetricTrends] = useState({});
  const prevMetricsRef = useRef(null);
  const [chartNowSec, setChartNowSec] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setChartNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    socket.connect();

    const onNewEvent = (data) => {
      setEvents((prev) => [data, ...prev].slice(0, 200));
      setTimestamps((prev) => [...prev, Date.now()].slice(-200));
    };

    socket.on("new-event", onNewEvent);

    return () => {
      socket.off("new-event", onNewEvent);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadMetrics = async () => {
      try {
        const { data } = await api.get("/api/metrics");
        if (cancelled) {
          return;
        }
        const snapshot = {
          totalEvents: data.totalEvents ?? 0,
          processedEvents: data.processedEvents ?? 0,
          failedEvents: data.failedEvents ?? 0,
          dlqCount: data.dlqCount ?? 0,
          eventsPerSecond: data.eventsPerSecond ?? 0,
        };
        setMetricTrends(computeMetricTrends(prevMetricsRef.current, snapshot));
        prevMetricsRef.current = snapshot;

        setServerMetrics(snapshot);
        const t = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const eps = Number(data.eventsPerSecond ?? 0);
        setEpsChartData((prev) => [...prev, { time: t, eps }].slice(-48));
      } catch {
        /* keep last known values */
      }
    };
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const chartData = useMemo(() => {
    const secondCount = new Map();

    timestamps.forEach((ts) => {
      const sec = Math.floor(ts / 1000);
      secondCount.set(sec, (secondCount.get(sec) || 0) + 1);
    });

    const data = [];
    for (let sec = chartNowSec - 19; sec <= chartNowSec; sec += 1) {
      const date = new Date(sec * 1000);
      const time = `${date.getMinutes().toString().padStart(2, "0")}:${date
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;
      data.push({ time, count: secondCount.get(sec) || 0 });
    }

    return data;
  }, [timestamps, chartNowSec]);

  const eventsPerSecond = chartData.length ? chartData[chartData.length - 1].count : 0;

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const cardShell = p.card;

  const dashboardFooter = (
    <footer className={`flex flex-col items-center justify-between gap-2 border-t py-6 text-[11px] sm:flex-row ${p.footer}`}>
      <p> 2026 Event Streaming System. All rights reserved.</p>
      <p className={p.footerSub}>Built for Developers</p>
    </footer>
  );

  const renderMain = () => {
    switch (activeNav) {
      case "topics":
        return (
          <>
            <div className={cardShell}>
              <Topics />
            </div>
            {dashboardFooter}
          </>
        );
      case "producer":
        return (
          <>
            <div className="space-y-6">
              <ProducerConsole />
              <ProducerPanel />
              <div className={cardShell}>
                <p className={`mb-3 text-xs font-medium uppercase tracking-wide ${p.label}`}>Quick send</p>
                <EventTrigger />
              </div>
            </div>
            {dashboardFooter}
          </>
        );
      case "consumers":
        return (
          <>
            <div className={cardShell}>
              <h2 className={`mb-2 text-lg font-semibold ${p.panelTitle}`}>Consumers</h2>
              <p className={`text-sm ${p.pageBody}`}>
                Consumer groups run in the worker process (Redis <code className={p.docCode}>XREADGROUP</code>).
                Configure streams in the worker codebase.
              </p>
            </div>
            {dashboardFooter}
          </>
        );
      case "live-stream":
        return (
          <>
            <LiveStream events={events} onClear={() => setEvents([])} />
            {dashboardFooter}
          </>
        );
      case "dlq":
        return (
          <>
            <DLQ />
            {dashboardFooter}
          </>
        );
      case "metrics":
        return (
          <>
            <Metrics
              metrics={serverMetrics}
              eventsPerSecond={eventsPerSecond}
              chartData={chartData}
              epsChartData={epsChartData}
              trends={metricTrends}
              variant="full"
            />
            {dashboardFooter}
          </>
        );
      case "settings":
        return (
          <>
            <div className={cardShell}>
              <h2 className={`mb-2 text-lg font-semibold ${p.panelTitle}`}>Settings</h2>
              <p className={`text-sm ${p.pageBody}`}>API base URL and preferences are configured in code / env.</p>
            </div>
            {dashboardFooter}
          </>
        );
      case "documentation":
        return (
          <>
            <div className={cardShell}>
              <h2 className={`mb-2 text-lg font-semibold ${p.panelTitle}`}>Documentation</h2>
              <ul className={`list-inside list-disc space-y-2 text-sm ${p.docText}`}>
                <li>
                  <code className={p.docCode}>POST /api/event</code> — legacy publish (topic optional)
                </li>
                <li>
                  <code className={p.docCode}>POST /api/publish</code> — developer publish (topic required)
                </li>
                <li>
                  <code className={p.docCode}>GET /api/events/dlq</code> — DLQ entries
                </li>
                <li>
                  <code className={p.docCode}>POST /api/retry</code> — admin retry from DLQ
                </li>
                <li>
                  <code className={p.docCode}>GET /api/metrics</code> — counts + rate
                </li>
              </ul>
            </div>
            {dashboardFooter}
          </>
        );
      case "dashboard":
      default:
        return (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-2 xl:grid-rows-[minmax(420px,auto)_minmax(360px,auto)] xl:items-stretch">
              <div className="min-h-[420px] min-w-0 xl:min-h-0">
                <ProducerConsole />
              </div>
              <div className="min-h-[420px] min-w-0 xl:min-h-0">
                <LiveStream events={events} onClear={() => setEvents([])} />
              </div>
              <div className="min-h-[360px] min-w-0 xl:min-h-0">
                <Metrics
                  metrics={serverMetrics}
                  eventsPerSecond={eventsPerSecond}
                  chartData={chartData}
                  epsChartData={epsChartData}
                  trends={metricTrends}
                  variant="dashboard"
                />
              </div>
              <div className="min-h-[360px] min-w-0 xl:min-h-0">
                <DLQ />
              </div>
            </div>
            {dashboardFooter}
          </div>
        );
    }
  };

  return (
    <div className={`flex min-h-screen flex-col ${p.page}`}>
      <HeaderBar onLogout={handleLogout} onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          active={activeNav}
          onNavigate={setActiveNav}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />
        <main className={`min-w-0 flex-1 overflow-y-auto p-4 pb-6 md:p-6 ${p.main}`}>{renderMain()}</main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ThemeProvider>
      <DashboardShell />
    </ThemeProvider>
  );
}
