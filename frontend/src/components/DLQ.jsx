import { useEffect, useState } from "react";
import { useDashPalette } from "../hooks/useDashPalette";
import api, { fetchDLQ } from "../services/api";
import { IconAlertTriangle, IconRefreshCw, IconTrash } from "./icons";

function typeBadgeClass(type) {
  const t = (type || "").toUpperCase();
  if (t.includes("ORDER") && t.includes("FAIL")) {
    return "border-rose-500/40 bg-rose-950/50 text-rose-200";
  }
  if (t.includes("PAYMENT") && t.includes("FAIL")) {
    return "border-amber-500/40 bg-amber-950/50 text-amber-200";
  }
  if (t.includes("INVENTORY")) {
    return "border-gray-500/40 bg-gray-800/60 text-gray-200";
  }
  if (t.includes("SYSTEM") || t.includes("ERROR")) {
    return "border-yellow-500/40 bg-yellow-950/40 text-yellow-200";
  }
  return "border-gray-600/50 bg-gray-800/50 text-gray-200";
}

function DLQ() {
  const p = useDashPalette();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingAll, setRetryingAll] = useState(false);

  const load = async () => {
    try {
      const response = await fetchDLQ();
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      console.log(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, []);

  const handleRetry = async (row) => {
    const messageId = row._id;
    if (!messageId) {
      alert("Missing message id; cannot retry.");
      return;
    }
    const snapshot = rows;
    setRows((prev) => prev.filter((r) => r._id !== messageId));
    try {
      await api.post("/api/retry", { messageId });
    } catch (err) {
      console.log(err);
      setRows(snapshot);
      alert(err.response?.data?.message || "Retry failed");
    }
  };

  const handleRetryAll = async () => {
    if (rows.length === 0) {
      return;
    }
    if (!window.confirm(`Retry all ${rows.length} message(s)?`)) {
      return;
    }
    setRetryingAll(true);
    const snapshot = [...rows];
    try {
      for (const row of snapshot) {
        const messageId = row._id;
        if (!messageId) {
          continue;
        }
        await api.post("/api/retry", { messageId });
      }
      await load();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Retry all failed");
      await load();
    } finally {
      setRetryingAll(false);
    }
  };

  const deleteDisabled = p.isLight
    ? "cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 p-2 text-slate-400"
    : "cursor-not-allowed rounded-lg border border-gray-700 bg-gray-800/50 p-2 text-gray-600";

  return (
    <section className={p.panel}>
      <div className={`flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 ${p.panelHeaderBorder}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-600/25 ring-1 ring-amber-500/25">
            <IconAlertTriangle className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold tracking-tight ${p.panelTitle}`}>Dead Letter Queue</h2>
            <p className={`text-[11px] ${p.panelMuted}`}>GET /api/events/dlq · POST /api/retry</p>
          </div>
        </div>
        <button
          type="button"
          disabled={loading || rows.length === 0 || retryingAll}
          onClick={handleRetryAll}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40 ${p.dlqRetryBar}`}
        >
          <IconRefreshCw className={`h-4 w-4 ${retryingAll ? "animate-spin" : ""}`} />
          Retry all
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5 pt-4">
        {loading ? (
          <p className={`py-12 text-center text-sm ${p.emptyState}`}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={`rounded-xl border py-14 text-center text-sm ${p.dlqEmptyBox}`}>No failed events</p>
        ) : (
          <div className={`overflow-x-auto rounded-xl border ${p.tableWrap}`}>
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className={`text-[10px] font-bold uppercase tracking-wide ${p.tableHead}`}>
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Time</th>
                  <th className="whitespace-nowrap px-4 py-3">Topic</th>
                  <th className="whitespace-nowrap px-4 py-3">Type</th>
                  <th className="px-4 py-3">Error</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${p.tableDivide} ${p.tableCell}`}>
                {rows.map((row, i) => (
                  <tr key={row._id || i} className={`transition ${p.tableRowHover}`}>
                    <td className={`whitespace-nowrap px-4 py-3 font-mono text-[11px] ${p.tableMono}`}>
                      {row.createdAt ? String(row.createdAt).slice(0, 19).replace("T", " ") : "—"}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-2 font-mono text-[11px] ${p.tableCell}`}>
                      {row.topic || "default"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeBadgeClass(row.type)}`}
                      >
                        {row.type || "—"}
                      </span>
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-2 text-[11px] text-rose-200/90" title={row.error}>
                      {row.error || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRetry(row)}
                          title="Retry"
                          className="rounded-lg border border-blue-500/40 bg-blue-600/20 p-2 text-blue-300 transition hover:bg-blue-600/35 hover:text-white"
                        >
                          <IconRefreshCw className="h-4 w-4" />
                        </button>
                        <button type="button" disabled title="Delete is not available from this UI" className={deleteDisabled}>
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default DLQ;
