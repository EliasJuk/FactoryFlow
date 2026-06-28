export const palette = {
  orange: {
    primary: "bg-orange-500",
    primaryHover: "hover:bg-orange-600",
    light: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-500"
  },

  black: {
    primary: "bg-black",
    text: "text-black",
    soft: "text-slate-900"
  },

  gray: {
    page: "bg-slate-100",
    card: "bg-white",
    border: "border-slate-300",
    text: "text-slate-700",
    muted: "text-slate-500",
    header: "bg-slate-50"
  }
} as const

export const ui = {
  page: "min-h-screen bg-[var(--soft)]",
  section: "space-y-4 p-6",

  card: `rounded-lg ${palette.gray.card} p-4 shadow-sm`,
  cardHeader: "border-b px-4 py-3",

  label: `mb-1 block text-xs font-semibold ${palette.gray.text}`,
  title: `text-base font-bold ${palette.black.soft}`,
  subtitle: `mt-1 text-xs ${palette.gray.muted}`,

  input:
    `w-full rounded-md border ${palette.gray.border} px-3 py-2 text-sm outline-none focus:border-orange-500`,

  select:
    `w-full rounded-md border ${palette.gray.border} px-3 py-2 text-sm outline-none focus:border-orange-500`,

  buttonPrimary:
    `rounded-md ${palette.orange.primary} px-4 py-2 text-sm font-semibold text-white ${palette.orange.primaryHover}`,

  buttonSecondary:
    `rounded-md ${palette.black.primary} px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800`,

  buttonDanger:
    "rounded-md bg-red-600 p-2 text-white hover:bg-red-700",

  selectorButton:
    "rounded-md border px-3 py-2 text-sm font-semibold",

  selectorButtonActive:
    `${palette.orange.border} ${palette.orange.primary} text-white`,

  selectorButtonInactive:
    `${palette.gray.border} bg-white ${palette.gray.text} hover:bg-slate-50`,

  selectorSubButtonActive:
    `${palette.orange.border} ${palette.orange.light} ${palette.orange.text}`,

  selectorSubButtonInactive:
    `${palette.gray.border} bg-white ${palette.gray.text} hover:bg-slate-50`,

  postoButton:
    "rounded-md border px-3 py-2 text-left text-sm font-semibold",

  dashboardHeader:
    `flex h-16 items-center justify-center border-b ${palette.black.primary}`,

  dashboardTitle:
    "text-xl font-bold text-white",

  dashboardUserBar:
    "bg-white px-6 py-2 text-xs text-slate-600",

  dashboardGroup:
    "space-y-3",

  dashboardGroupTitle:
    "px-1 text-xs font-bold uppercase tracking-wide text-slate-500",

  dashboardCard:
    "flex h-24 items-center gap-3 rounded-lg bg-white p-4 text-left shadow-sm transition hover:scale-[1.02] hover:shadow-md",

  dashboardCardIcon:
    `flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${palette.orange.light} ${palette.orange.text}`,

  dashboardCardTitle:
    "text-sm font-bold text-slate-900",

  dashboardCardDescription:
    "mt-1 text-xs text-slate-500",

  table: "min-w-full",
  tableHeader:
    "px-4 py-2 text-left text-xs font-semibold text-slate-600",
  tableHeaderRight:
    "px-4 py-2 text-right text-xs font-semibold text-slate-600",
  tableCell:
    "px-4 py-2 text-sm text-slate-700",
  tableCellStrong:
    "px-4 py-2 text-sm font-medium text-slate-700",
  empty:
    "px-4 py-6 text-center text-xs text-slate-500"
} as const