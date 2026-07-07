import { NavLink, Outlet } from "react-router";
import { mobileNavigationItems, navigationItems } from "../data/navigation";
import { useAppStatus } from "../context/AppStatusContext";
import useTheme from "../hooks/useTheme";

const sidebarLinkClass = ({ isActive }) => [
  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
  isActive ? "bg-primary/10 text-primary font-bold" : "hover:bg-slate-100 dark:hover:bg-slate-800",
].join(" ");

const mobileLinkClass = ({ isActive }) => ["flex flex-col items-center", isActive ? "text-primary" : "text-slate-400"].join(" ");

const STATUS = {
  demo: ["Demo", "bg-blue-100 text-blue-700 border-blue-200"],
  connecting: ["Conectando", "bg-amber-100 text-amber-700 border-amber-200"],
  live: ["Vivo", "bg-emerald-100 text-emerald-700 border-emerald-200"],
  offline: ["Sin conexión", "bg-slate-100 text-slate-600 border-slate-200"],
  error: ["Error", "bg-red-100 text-red-700 border-red-200"],
  historical: ["Histórico", "bg-violet-100 text-violet-700 border-violet-200"],
};

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button type="button" onClick={toggleTheme} aria-label="Cambiar tema claro u oscuro"
      className="mx-4 mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
      <span className={`material-symbols-outlined ${!dark ? "text-amber-500" : "text-slate-400"}`}>light_mode</span>
      <span className="relative mx-2 h-7 w-12 rounded-full bg-slate-300 dark:bg-primary">
        <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${dark ? "translate-x-5" : "translate-x-0"}`} />
      </span>
      <span className={`material-symbols-outlined ${dark ? "text-blue-300" : "text-slate-400"}`}>dark_mode</span>
    </button>
  );
}

function Sidebar() {
  return <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen overflow-y-auto">
    <div className="p-6 flex items-center gap-3"><div className="bg-primary rounded-lg p-2 text-white"><span className="material-symbols-outlined">school</span></div><div><h1 className="text-base font-bold">Centinela-SmartRiberIA</h1><div className="text-slate-400 text-sm">by Ribera del Tajo</div></div></div>
    <nav className="flex-1 px-4 space-y-1 pb-6">{navigationItems.map(item => <NavLink key={item.path} to={item.path} className={sidebarLinkClass}><span className="material-symbols-outlined">{item.icon}</span><span>{item.label}</span></NavLink>)}</nav>
    <ThemeToggle />
  </aside>;
}

function Header() {
  const { status, detail } = useAppStatus();
  const [label, style] = STATUS[status] ?? STATUS.offline;
  return <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky top-0 z-30">
    <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3"><span className="text-xs font-black uppercase tracking-wider text-secondary">Estado de la aplicación</span><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${style}`}><span className="h-2 w-2 rounded-full bg-current" />{label}</span><span className="hidden md:inline truncate text-xs text-secondary">{detail}</span></div>
      <div className="flex items-center gap-4"><div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase">Sistema OK</span></div><button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">notifications</span></button></div>
    </div>
  </header>;
}

function Footer(){return <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"><div className="max-w-7xl mx-auto text-center text-slate-400 text-sm">© 2026 Centinela-SmartRiberIA IoT/IA System.</div></footer>}
function MobileNavigation(){return <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around p-3">{mobileNavigationItems.map(item=><NavLink key={item.path} to={item.path} className={mobileLinkClass}><span className="material-symbols-outlined">{item.icon}</span><span className="text-[10px] mt-1">{item.label}</span></NavLink>)}</nav>}
export default function AppLayout(){return <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen"><div className="flex flex-col lg:flex-row min-h-screen"><Sidebar/><main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0"><Header/><Outlet/><Footer/></main><MobileNavigation/></div></div>}
