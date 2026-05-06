import { useTheme } from "./useTheme";

/** Semantic Tailwind classes for dashboard chrome / panels — paired with ThemeProvider */
export function useDashPalette() {
  const { theme } = useTheme();
  const L = theme === "light";

  return {
    theme,
    isLight: L,

    page: L ? "bg-slate-100 text-slate-900" : "bg-[#0B1120] text-white",

    header: L
      ? "border-slate-200 bg-white/95 text-slate-900 backdrop-blur-md"
      : "border-gray-800/90 bg-[#111827]/95 text-white backdrop-blur-md",

    headerTitle: L ? "text-slate-900" : "text-white",
    headerSubtitle: L ? "text-slate-500" : "text-gray-500",

    menuBtn: L
      ? "rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:border-blue-400/50 hover:text-slate-900 md:hidden"
      : "rounded-xl border border-gray-700 p-2 text-gray-300 transition hover:border-blue-500/40 hover:text-white md:hidden",

    statusPill: L
      ? "border-slate-200 bg-slate-100 text-slate-800 shadow-inner"
      : "border-gray-700/90 bg-[#0B1120] text-gray-200 shadow-inner",

    statusText: L ? "text-slate-800" : "text-gray-200",

    /** Outer chrome on moon/sun toggle — dark mode matches prod UI reference */
    themeToggleBtn: L
      ? "rounded-xl border border-slate-200 bg-slate-100 p-2 text-amber-500 transition hover:bg-slate-200"
      : "rounded-xl border border-gray-800 bg-[#111827] p-2 transition hover:bg-gray-800/90",

    userName: L ? "text-slate-900" : "text-white",
    userRole: L ? "text-slate-500" : "text-gray-400",

    logoutBtn: L
      ? "rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
      : "rounded-xl border border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-gray-500 hover:bg-gray-800 hover:text-white",

    sidebar: L ? "border-slate-200 bg-white shadow-xl" : "border-gray-800/90 bg-[#111827] shadow-xl",

    sidebarNavIdle: L ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900" : "text-gray-400 hover:bg-gray-800/90 hover:text-white",

    sidebarNavActive:
      "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_24px_rgba(59,130,246,0.35)]",

    sidebarIconIdle: L ? "text-slate-400" : "text-gray-500",

    sidebarFooterDivider: L ? "border-slate-200" : "border-gray-800/90",

    sidebarStatusCard: L
      ? "rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-inner ring-1 ring-slate-200/60"
      : "rounded-xl border border-gray-800 bg-[#0B1120]/90 p-3 shadow-inner ring-1 ring-gray-800/60",

    sidebarStatusTitle: L ? "text-slate-900" : "text-white",
    sidebarUptime: L ? "text-slate-500" : "text-gray-500",
    sidebarUptimeMono: L ? "text-slate-800" : "text-gray-300",
    sidebarVersion: L ? "text-slate-400" : "text-gray-600",
    sidebarSparklineBg: L ? "bg-slate-100" : "bg-[#111827]/80",

    main: L ? "bg-slate-100" : "",

    card: L
      ? "rounded-xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm ring-1 ring-slate-200/80"
      : "rounded-xl border border-gray-800 bg-[#111827] p-5 text-white shadow-lg ring-1 ring-gray-800/60",

    footer: L ? "mt-8 border-slate-200 text-slate-600" : "mt-8 border-gray-800/80 text-gray-600",
    footerSub: L ? "text-slate-500" : "text-gray-500",

    panel: L
      ? "flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
      : "flex h-full min-h-0 flex-col rounded-xl border border-gray-800 bg-[#111827] text-white shadow-xl ring-1 ring-gray-800/60",

    panelHeaderBorder: L ? "border-slate-200" : "border-gray-800/80",
    panelTitle: L ? "text-slate-900" : "text-white",
    panelMuted: L ? "text-slate-500" : "text-gray-500",

    iconBoxBlue: L
      ? "bg-gradient-to-br from-blue-500/15 to-purple-600/15 ring-blue-200"
      : "bg-gradient-to-br from-blue-500/25 to-purple-600/25 ring-blue-500/30",
    iconBlue: L ? "text-blue-600" : "text-blue-300",

    toastOk: L ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-emerald-700/50 bg-emerald-950/35 text-emerald-200",
    toastErr: L ? "border-red-200 bg-red-50 text-red-900" : "border-red-700/50 bg-red-950/35 text-red-200",

    label: L ? "text-slate-500" : "text-gray-500",
    inset: L ? "border-slate-200 bg-slate-50 text-slate-900" : "border-gray-700 bg-[#0B1120] text-gray-200",
    input: L ? "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400" : "border-gray-700 bg-[#0B1120] text-white placeholder:text-gray-600",
    lineGutter: L ? "border-r border-slate-200 text-slate-400" : "border-r border-gray-800 text-gray-600",
    formatBtn: L
      ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
      : "border-gray-700 bg-[#0B1120] text-gray-300 hover:border-gray-600 hover:text-white",

    filterBarBorder: L ? "border-slate-200" : "border-gray-800/80",
    pillInactive: L ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300" : "border-gray-700 bg-[#0B1120] text-gray-400 hover:border-gray-600",
    pillInactiveSwitch: L ? "border-slate-200 bg-slate-100 text-slate-700" : "border-gray-700 bg-[#0B1120] text-gray-300",
    switchOff: L ? "bg-slate-300" : "bg-gray-700",

    subtleBorder: L ? "border-slate-200" : "border-gray-800/70",
    timelineGradient: L ? "from-blue-500/30 via-slate-300" : "from-blue-500/40 via-gray-700",
    dotRing: L ? "ring-white" : "ring-[#111827]",
    typePill: L ? "border-slate-200 bg-white text-slate-800" : "border-gray-700 bg-[#0B1120] text-gray-100",
    linkAccent: L ? "text-blue-600 hover:text-blue-700" : "text-blue-400 hover:text-blue-300",
    jsonPre: L ? "border-slate-200 bg-slate-50 text-slate-800" : "border-gray-800 bg-[#0B1120] text-gray-300",
    previewBox: L ? "border-slate-200 bg-slate-50 text-slate-600" : "border-gray-800/80 bg-[#0B1120]/80 text-gray-400",

    statCard: L ? "border-slate-200 bg-slate-50 ring-slate-200/80" : "border-gray-800/90 bg-[#0B1120] ring-white/5",
    statLabel: L ? "text-slate-500" : "text-gray-500",
    statHint: L ? "text-slate-400" : "text-gray-600",

    chartCard: L ? "border-slate-200 bg-white ring-slate-200/50" : "border-gray-800 bg-[#111827] ring-gray-800/50",
    chartHelp: L ? "text-slate-500" : "text-gray-600",

    dlqRetryBar: L ? "border-slate-200 bg-white text-slate-800 hover:border-amber-400/50" : "border-gray-700 bg-[#0B1120] text-gray-200",
    dlqEmptyBox: L
      ? "border-dashed border-slate-300 bg-slate-50 text-slate-500"
      : "border-dashed border-gray-700 bg-[#0B1120]/80 text-gray-500",
    tableWrap: L ? "border-slate-200" : "border-gray-800",
    tableDivide: L ? "divide-slate-200" : "divide-gray-800",
    tableHead: L ? "bg-slate-100 text-slate-500" : "bg-[#0B1120] text-gray-400",
    tableCell: L ? "text-slate-700" : "text-gray-200",
    tableMono: L ? "text-slate-500" : "text-gray-400",
    tableRowHover: L ? "hover:bg-slate-50" : "hover:bg-gray-800/35",

    topicsSection: L ? "border-slate-200 bg-slate-50" : "border-gray-800 bg-[#0B1120]",
    topicsItem: L ? "border-slate-200 bg-white text-slate-800 hover:border-blue-400/40" : "border-gray-700 bg-[#111827] text-gray-200 hover:border-blue-500/30",

    docText: L ? "text-slate-600" : "text-gray-400",
    docCode: L ? "text-cyan-700" : "text-cyan-400",

    trendMuted: L ? "text-slate-400" : "text-gray-600",

    pageBody: L ? "text-slate-600" : "text-gray-400",
  };
}
