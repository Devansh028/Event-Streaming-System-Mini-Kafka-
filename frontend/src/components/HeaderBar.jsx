import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { useDashPalette } from "../hooks/useDashPalette";
import socket from "../services/socket";
import { IconMoon, IconSun } from "./icons";

function parseJwtRole() {
  const token = localStorage.getItem("token");
  if (!token) {
    return { email: "User", role: "Guest" };
  }
  try {
    const body = token.split(".")[1];
    const json = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    return {
      email: json.email || "User",
      role: json.role ? String(json.role) : "User",
    };
  } catch {
    return { email: "User", role: "User" };
  }
}

function HeaderBar({ onLogout, onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const p = useDashPalette();
  const [connected, setConnected] = useState(() => socket.connected);
  const user = useMemo(() => parseJwtRole(), []);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const displayName = user.email.includes("@") ? user.email.split("@")[0] : user.email;

  return (
    <header
      className={`sticky top-0 z-40 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-3 py-2 md:px-6 ${p.header}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className={p.menuBtn}
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className={`truncate text-base font-bold tracking-tight md:text-lg ${p.headerTitle}`}>Event Streaming System</h1>
          <p className={`hidden text-[11px] sm:block ${p.headerSubtitle}`}>inspired by Kafka</p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${p.statusPill}`}
          title={connected ? "Socket connected" : "Socket disconnected"}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-emerald-500 shadow-[0_0_10px_#34d399]" : "bg-red-500 shadow-[0_0_8px_#f87171]"
              }`}
            aria-hidden
          />
          <span className={`text-[11px] font-semibold sm:text-xs ${p.statusText}`}>
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className={p.themeToggleBtn}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            <IconMoon className="h-5 w-5 text-yellow-400" />
          ) : (
            <IconSun className="h-5 w-5 text-amber-500" />
          )}
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white shadow-lg ring-2 ring-white/10">
            {(displayName || "A").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 text-right leading-tight">
            <p className={`max-w-[120px] truncate text-xs font-semibold md:max-w-[160px] ${p.userName}`}>{displayName}</p>
            <p className={`text-[10px] font-medium uppercase tracking-wide ${p.userRole}`}>{user.role}</p>
          </div>
        </div>

        <button type="button" onClick={onLogout} className={p.logoutBtn}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default HeaderBar;
