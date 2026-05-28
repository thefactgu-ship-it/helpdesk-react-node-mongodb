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
  ScrollText,
  ShieldCheck,
  User,
  UserCog,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  canManageDepartments,
  canManageHotelSettings,
  canManageUsers,
} from "../config/rolePolicy";

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
      { id: "audit-logs", textKey: "nav.auditLogs", icon: ScrollText, enabled: true },
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
  const hasSystemAccess =
    canManageUsers(currentUser?.role) ||
    canManageDepartments(currentUser?.role) ||
    canManageHotelSettings(currentUser?.role);
  const isGroupAdmin = ["GroupAdmin", "Admin"].includes(currentUser?.role);
  const isDepartmentManager = canManageDepartments(currentUser?.role);
  const isHotelSettingsManager = canManageHotelSettings(currentUser?.role);
  const isUserManager = canManageUsers(currentUser?.role);
  const isRequester = currentUser?.role === "User";
  const visibleGroups = useMemo(
    () =>
      menuGroups
        .filter((group) => !group.adminOnly || hasSystemAccess)
        .filter((group) => group.labelKey !== "nav.reports" || !isRequester)
        .map((group) => ({
          ...group,
          items: group.items
            .filter((item) => !["assets", "problem-types"].includes(item.id) || isHotelSettingsManager)
            .filter((item) => item.id !== "audit-logs" || isHotelSettingsManager)
            .filter((item) => !item.groupOnly || isGroupAdmin)
            .filter((item) => !item.managerOnly || isDepartmentManager)
            .filter((item) => item.id !== "user-management" || isUserManager),
        }))
        .filter((group) => group.items.length),
    [hasSystemAccess, isDepartmentManager, isGroupAdmin, isHotelSettingsManager, isRequester, isUserManager],
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

      <aside className="ops-sidebar text-slate-200">
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
          className="relative border-t border-[#2d1c45] p-4 dark:border-slate-800"
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
            className="flex w-full items-center gap-3 rounded-xl bg-[#2d1c45] p-3 text-left transition hover:bg-white/10"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            aria-label={t("nav.accountMenu")}
          >
            <Avatar name={userName} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {userName}
              </p>
              <p className="truncate, text-xs text-purple-300">
                {userRole}
                {userTeam ? ` / ${userTeam}` : ""}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-purple-300 transition ${
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
  const isRequester = currentUser?.role === "User";
  const bottomItems = [
    { id: "dashboard", text: t("nav.home"), icon: Home, action: () => onNavigate("dashboard") },
    { id: "tickets", text: t("nav.tickets"), icon: ClipboardList, action: () => onNavigate("tickets") },
    { id: "add-ticket", text: t("nav.add"), icon: PlusCircle, action: () => onNavigate("add-ticket") },
    !isRequester && { id: "monthly-report", text: t("nav.reports"), icon: BarChart3, action: () => onNavigate("monthly-report") },
    { id: "profile", text: t("nav.profile"), icon: User, action: onOpenProfile },
  ].filter(Boolean);

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#2d1c45] bg-[#1e0a3d] px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="grid h-11 w-11 place-items-center rounded-xl border border-[#2d1c45] text-purple-200 bg-white/5 hover:bg-white/10"
          aria-label={t("nav.openMenu")}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 px-3 text-center">
          <p className="truncate text-sm font-black text-white">
            IT Help Desk
          </p>
          <p className="truncate text-xs text-purple-300">
            {userName}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          className="grid h-11 w-11 place-items-center rounded-xl bg-purple-600 text-xs font-black text-white"
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
          <div className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-[#1e0a3d] border-r border-[#2d1c45] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2d1c45] p-4">
              <BrandHeader compact />
              <button
                type="button"
                onClick={onCloseDrawer}
                className="grid h-11 w-11 place-items-center rounded-xl border border-[#2d1c45] text-purple-200 bg-white/5 hover:bg-white/10"
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

            <div className="border-t border-[#2d1c45] p-4">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                {t("nav.logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className={`fixed inset-x-0 bottom-0 z-40 grid ${isRequester ? "grid-cols-4" : "grid-cols-5"} border-t border-[#2d1c45] bg-[#1e0a3d] px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] backdrop-blur md:hidden`} aria-label="Mobile primary navigation">
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
              className={`flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-bold transition-colors duration-200 ${
                active
                  ? "bg-purple-600 text-white shadow-sm dark:bg-purple-500"
                  : "text-purple-300 hover:bg-white/10 hover:text-white dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-purple-200"
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
    <div className={`${compact ? "flex items-center gap-3" : "border-b border-purple-100/15 p-5 dark:border-purple-200/10"}`}>
      <div className={`${compact ? "" : "mb-5"} flex h-10 w-10 items-center justify-center rounded-lg bg-[#6B21A8] text-sm font-bold text-white shadow-[0_10px_28px_rgba(107,33,168,0.25)] ring-1 ring-purple-900/10 dark:bg-purple-600`}>
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </div>

      <div>
        <h1 className={`${compact ? "text-base" : "text-2xl"} font-black leading-tight text-white`}>
          IT Help Desk
        </h1>
        <p className="text-xs font-bold text-purple-300 dark:text-purple-200">
          Multi-Hotel Support
        </p>
      </div>
    </div>
  );
}

function NavGroup({ activePage, group, onNavigate, t }) {
  return (
    <div>
      <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-400/60">
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
    <div className="absolute bottom-[5.25rem] left-4 right-4 z-20 overflow-hidden rounded-lg border border-purple-100/15 bg-purple-950/50 p-2 shadow-xl backdrop-blur dark:border-purple-200/10 dark:bg-purple-950/70 dark:shadow-slate-950/50">
      <button
        type="button"
        onClick={onOpenProfile}
        className="w-full rounded-md px-3 py-2.5 text-left text-sm font-bold text-slate-200 transition-colors hover:bg-purple-500/10 hover:text-white dark:text-slate-200 dark:hover:bg-purple-500/20 dark:hover:text-purple-100"
      >
        {t("nav.updateProfile")}
      </button>
      <button
        type="button"
        onClick={onOpenPassword}
        className="w-full rounded-md px-3 py-2.5 text-left text-sm font-bold text-slate-200 transition-colors hover:bg-purple-500/10 hover:text-white dark:text-slate-200 dark:hover:bg-purple-500/20 dark:hover:text-purple-100"
      >
        {t("nav.changePassword")}
      </button>
      <div className="my-2 h-px bg-purple-100/15 dark:bg-purple-200/10" />
      <button
        type="button"
        onClick={onLogout}
        className="w-full rounded-md px-3 py-2.5 text-left text-sm font-bold text-rose-400 transition-colors hover:bg-rose-500/10"
      >
        {t("nav.logout")}
      </button>
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-xs font-bold text-white shadow-sm dark:bg-purple-500">
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
      className={`ops-nav-item ${
        active
          ? "ops-nav-item-active"
          : enabled
            ? "ops-nav-item-idle"
            : "cursor-not-allowed text-slate-500"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <span className="absolute -left-4 top-2 h-[calc(100%-1rem)] w-1 rounded-r bg-purple-500 dark:bg-purple-300" />
      )}
      <span className={active ? "ops-nav-icon bg-purple-600 text-white" : "ops-nav-icon"}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate">{text}</span>
    </button>
  );
}

export default Sidebar;
