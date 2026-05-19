import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  Hash,
  Home,
  Laptop,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  User,
  UserCog,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const menuGroups = [
  {
    labelKey: "nav.main",
    items: [
      { id: "dashboard", textKey: "nav.dashboard", icon: LayoutDashboard, enabled: true },
      { id: "tickets", textKey: "nav.tickets", icon: ClipboardList, enabled: true },
      { id: "add-ticket", textKey: "nav.addTicket", icon: PlusCircle, enabled: true },
    ],
  },
  {
    labelKey: "nav.reports",
    items: [
      { id: "monthly-report", textKey: "nav.monthlyReport", icon: CalendarDays, enabled: true },
      { id: "quarterly-report", textKey: "nav.quarterlyReport", icon: BarChart3, enabled: true },
    ],
  },
  {
    labelKey: "nav.system",
    adminOnly: true,
    items: [
      { id: "assets", textKey: "nav.assets", icon: Laptop, enabled: true },
      { id: "departments", textKey: "nav.departments", icon: FileBarChart, enabled: true, managerOnly: true },
      {
        id: "hotels",
        textKey: "nav.hotels",
        icon: Building2,
        enabled: true,
        groupOnly: true,
      },
      { id: "user-management", textKey: "nav.users", icon: UserCog, enabled: true },
      { id: "problem-types", textKey: "nav.problemTypes", icon: Hash, enabled: true },
    ],
  },
];

function getInitials(name) {
  if (!name) return "SA";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Sidebar({
  activePage,
  currentUser,
  onNavigate,
  onLogout,
  onOpenPassword,
  onOpenProfile,
  t,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userName = currentUser?.name || "Welcome";
  const userRole = currentUser?.role || "User";
  const userTeam = currentUser?.team || "Support";
  const isAdmin = ["GroupAdmin", "Admin", "HotelAdmin"].includes(currentUser?.role);
  const isGroupAdmin = ["GroupAdmin", "Admin"].includes(currentUser?.role);
  const isManager = ["GroupAdmin", "Admin", "RegionalManager", "HotelAdmin", "Manager"].includes(currentUser?.role);
  const visibleGroups = useMemo(
    () =>
      menuGroups
        .filter((group) => !group.adminOnly || isAdmin)
        .map((group) => ({
          ...group,
          items: group.items
            .filter((item) => !item.groupOnly || isGroupAdmin)
            .filter((item) => !item.managerOnly || isManager),
        }))
        .filter((group) => group.items.length),
    [isAdmin, isGroupAdmin, isManager],
  );

  useEffect(() => {
    if (!userMenuOpen) return;

    const closeOnOutsideClick = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!drawerOpen) return;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const navigate = (page) => {
    onNavigate(page);
    setDrawerOpen(false);
  };

  const handleProfile = () => {
    setUserMenuOpen(false);
    setDrawerOpen(false);
    onOpenProfile();
  };

  const handlePassword = () => {
    setUserMenuOpen(false);
    setDrawerOpen(false);
    onOpenPassword();
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    setDrawerOpen(false);
    onLogout();
  };

  return (
    <>
      <MobileChrome
        activePage={activePage}
        currentUser={currentUser}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
        onLogout={handleLogout}
        onNavigate={navigate}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={handleProfile}
        t={t}
        visibleGroups={visibleGroups}
      />

      <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 md:flex md:min-h-[calc(100vh-3rem)]">
        <BrandHeader compact={false} />

        <nav className="flex-1 space-y-6 px-4 py-5 text-sm" aria-label="Primary navigation">
          {visibleGroups.map((group) => (
            <NavGroup
              key={group.labelKey}
              activePage={activePage}
              group={group}
              onNavigate={navigate}
              t={t}
            />
          ))}
        </nav>

        <div
          ref={userMenuRef}
          className="relative border-t border-slate-100 p-4 dark:border-slate-800"
        >
          {userMenuOpen && (
            <ProfileMenu
              onLogout={handleLogout}
              onOpenPassword={handlePassword}
              onOpenProfile={handleProfile}
              t={t}
            />
          )}

          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            aria-label={t("nav.accountMenu")}
          >
            <Avatar name={userName} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
                {userName}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {userRole}
                {userTeam ? ` / ${userTeam}` : ""}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                userMenuOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </aside>
    </>
  );
}

function MobileChrome({
  activePage,
  currentUser,
  drawerOpen,
  onCloseDrawer,
  onLogout,
  onNavigate,
  onOpenDrawer,
  onOpenProfile,
  t,
  visibleGroups,
}) {
  const userName = currentUser?.name || "Welcome";
  const bottomItems = [
    { id: "dashboard", text: t("nav.home"), icon: Home, action: () => onNavigate("dashboard") },
    { id: "tickets", text: t("nav.tickets"), icon: ClipboardList, action: () => onNavigate("tickets") },
    { id: "add-ticket", text: t("nav.add"), icon: PlusCircle, action: () => onNavigate("add-ticket") },
    { id: "monthly-report", text: t("nav.reports"), icon: BarChart3, action: () => onNavigate("monthly-report") },
    { id: "profile", text: t("nav.profile"), icon: User, action: onOpenProfile },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
          aria-label={t("nav.openMenu")}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 px-3 text-center">
          <p className="truncate text-sm font-black text-slate-950 dark:text-white">
            IT Help Desk
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {userName}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-xs font-black text-white"
          aria-label={t("nav.profile")}
        >
          {getInitials(userName)}
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-slate-950/45"
            onClick={onCloseDrawer}
            aria-label={t("nav.closeMenu")}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-white shadow-2xl dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <BrandHeader compact />
              <button
                type="button"
                onClick={onCloseDrawer}
                className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
                aria-label={t("nav.closeMenu")}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5" aria-label="Mobile navigation">
              {visibleGroups.map((group) => (
                <NavGroup
                  key={group.labelKey}
                  activePage={activePage}
                  group={group}
                  onNavigate={onNavigate}
                  t={t}
                />
              ))}
            </nav>

            <div className="border-t border-slate-100 p-4 dark:border-slate-800">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-500/10"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                {t("nav.logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden" aria-label="Mobile primary navigation">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active =
            activePage === item.id ||
            (item.id === "monthly-report" && activePage === "quarterly-report");

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold transition ${
                active
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200"
                  : "text-slate-500 hover:text-blue-700 dark:text-slate-400"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate">{item.text}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

function BrandHeader({ compact }) {
  return (
    <div className={`${compact ? "flex items-center gap-3" : "border-b border-slate-100 p-5 dark:border-slate-800"}`}>
      <div className={`${compact ? "" : "mb-5"} flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white`}>
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </div>

      <div>
        <h1 className={`${compact ? "text-base" : "text-2xl"} font-black leading-tight text-slate-950 dark:text-white`}>
          IT Help Desk
        </h1>
        <p className="text-xs font-medium text-blue-600 dark:text-blue-300">
          Multi-Hotel Support
        </p>
      </div>
    </div>
  );
}

function NavGroup({ activePage, group, onNavigate, t }) {
  return (
    <div>
      <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-600">
        {t(group.labelKey)}
      </p>

      <div className="space-y-1">
        {group.items.map((item) => (
          <MenuItem
            key={item.id}
            active={activePage === item.id}
            enabled={item.enabled}
            icon={item.icon}
            text={t(item.textKey)}
            onClick={() => item.enabled && onNavigate(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ProfileMenu({ onLogout, onOpenPassword, onOpenProfile, t }) {
  return (
    <div className="absolute bottom-[5.25rem] left-4 right-4 z-20 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/80 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/50">
      <button
        type="button"
        onClick={onOpenProfile}
        className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-200"
      >
        {t("nav.updateProfile")}
      </button>
      <button
        type="button"
        onClick={onOpenPassword}
        className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-200"
      >
        {t("nav.changePassword")}
      </button>
      <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />
      <button
        type="button"
        onClick={onLogout}
        className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-500/10"
      >
        {t("nav.logout")}
      </button>
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
      {getInitials(name)}
    </div>
  );
}

function MenuItem({ text, icon: Icon, active, enabled, onClick }) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : enabled
            ? "text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-blue-200"
            : "cursor-not-allowed text-slate-300 dark:text-slate-700"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <span className="absolute -left-4 top-2 h-[calc(100%-1rem)] w-1 rounded-r bg-blue-600 dark:bg-blue-300" />
      )}
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          active
            ? "bg-white/20 text-white"
            : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-500"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">{text}</span>
    </button>
  );
}

export default Sidebar;
