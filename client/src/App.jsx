import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ShieldCheck } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ConfirmModal from "./components/ConfirmModal";
import LoginPage from "./components/LoginPage";
import PageRouter from "./components/PageRouter";
import Sidebar from "./components/Sidebar";
import TicketDetailModal from "./components/TicketDetailModal";
import TopBar from "./components/TopBar";
import { groupRoles } from "./config/appConfig";
import {
  canAssignTickets as roleCanAssignTickets,
  canManageDepartments as roleCanManageDepartments,
  canManageHotelSettings as roleCanManageHotelSettings,
  canManageTickets as roleCanManageTickets,
  canManageUsers as roleCanManageUsers,
} from "./config/rolePolicy";
import { useAuth } from "./hooks/useAuth";
import { useTicketActions } from "./hooks/useTicketActions";
import { useTicketFilters } from "./hooks/useTicketFilters";
import { useUserActions } from "./hooks/useUserActions";
import {
  createTranslator,
  getInitialLanguage,
  getPageMeta,
  persistLanguage,
} from "./i18n";
import { API_BASE_URL } from "./services/api";
import { getDepartments } from "./services/departmentService";
import { getHotels } from "./services/hotelService";
import { getActiveHotelContext } from "./utils/hotelContext";
import { getErrorMessage, getUserHotelAccessIds } from "./utils/entityHelpers";
import { filterActiveHotels, resolveSelectedHotelId } from "./utils/hotelHelpers";
import { lazyWithDeployRetry } from "./utils/lazyWithDeployRetry";

const ProfilePage = lazyWithDeployRetry(() => import("./pages/ProfilePage"));

const API_URL = `${API_BASE_URL}/tickets`;
const AUTH_URL = `${API_BASE_URL}/auth`;
const dashboardHotelChipRoles = new Set(["User", "Manager", "Agent"]);

function isPendingHotelAssignment(user) {
  const hotelId = user?.hotelId?._id || user?.hotelId || "";
  const hotelAccess = Array.isArray(user?.hotelAccess) ? user.hotelAccess : [];
  return Boolean(user) && !hotelId && hotelAccess.length === 0;
}

function App() {
  const [hotels, setHotels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(
    localStorage.getItem("selectedHotelId") || "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState(getInitialLanguage);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("token")));

  const t = useMemo(() => createTranslator(language), [language]);
  const auth = useAuth({
    onPasswordChangeRequired: () => setLoading(false),
    t,
  });
  const {
    activePage,
    authHeaders,
    changingPassword,
    currentUser,
    handleLogin: login,
    handleGoogleLogin: googleLogin,
    handleLogout: logout,
    openProfilePage,
    profileInitialSection,
    savingProfile,
    setActivePage,
    setCurrentUser,
    token,
    updateMyProfile,
  } = auth;

  const selectableHotels = useMemo(() => filterActiveHotels(hotels), [hotels]);
  const effectiveSelectedHotelId = useMemo(
    () => resolveSelectedHotelId(selectedHotelId, selectableHotels),
    [selectedHotelId, selectableHotels],
  );

  const scopedParams = useMemo(() => {
    if (!effectiveSelectedHotelId || effectiveSelectedHotelId === "all") return {};
    return { hotelId: effectiveSelectedHotelId };
  }, [effectiveSelectedHotelId]);

  const ticketListParams = useMemo(() => {
    const params = { ...scopedParams };
    if (currentUser?.role === "GroupAdmin") {
      params.limit = 200;
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterPriority !== "all") params.priority = filterPriority;
    }
    return params;
  }, [currentUser?.role, filterPriority, filterStatus, scopedParams]);

  const canManageTickets = roleCanManageTickets(currentUser?.role);
  const canAssignTickets = roleCanAssignTickets(currentUser?.role);
  const canManageDepartments = roleCanManageDepartments(currentUser?.role);
  const canManageUsers = roleCanManageUsers(currentUser?.role);
  const canManageHotelSettings = roleCanManageHotelSettings(currentUser?.role);

  const ticketActions = useTicketActions({
    authHeaders,
    canAssignTickets,
    canManageTickets,
    currentUser,
    departments,
    onOpenTicketPage: () => setActivePage("tickets"),
    scopedParams,
    setLoading,
    t,
    ticketListParams,
    token,
  });

  const userActions = useUserActions({
    authHeaders,
    currentUser,
    scopedParams,
    selectedHotelId: effectiveSelectedHotelId,
    setCurrentUser,
    token,
  });
  const { resetTickets, setSummaryTickets, setTickets } = ticketActions;
  const { resetUsers, setUsers } = userActions;

  const fetchHotels = useCallback(async () => {
    if (!token) {
      setHotels([]);
      return;
    }

    try {
      const data = await getHotels(token, { includeInactive: true });
      const activeHotels = filterActiveHotels(data);
      setHotels(data);
      setSelectedHotelId((current) => resolveSelectedHotelId(current, activeHotels));
    } catch (error) {
      console.error("Failed to fetch hotels", error);
    }
  }, [token]);

  const fetchDepartments = useCallback(async () => {
    if (!token) {
      setDepartments([]);
      return;
    }

    try {
      const data = await getDepartments(token, scopedParams);
      setDepartments(data);
    } catch (error) {
      console.error("Failed to fetch departments", error);
    }
  }, [scopedParams, token]);

  const accessibleHotelIds = [...new Set(getUserHotelAccessIds(currentUser))];
  const canSelectHotel =
    selectableHotels.length > 1 &&
    (groupRoles.includes(currentUser?.role) || accessibleHotelIds.length > 1);
  const shouldShowDashboardHotelChip = dashboardHotelChipRoles.has(currentUser?.role);
  const activeHotelContext = useMemo(
    () =>
      getActiveHotelContext({
        currentUser,
        hotels: selectableHotels,
        language,
        selectedHotelId: effectiveSelectedHotelId,
        t,
      }),
    [currentUser, selectableHotels, effectiveSelectedHotelId, language, t],
  );

  const visibleActivePage = useMemo(() => {
    if (
      currentUser?.role === "User" &&
      (activePage === "monthly-report" || activePage === "quarterly-report" || activePage === "weekly-report")
    ) {
      return "dashboard";
    }

    if (
      (activePage === "user-management" && !canManageUsers) ||
      (activePage === "request-users" && !canManageUsers) ||
      (activePage === "hotels" && !["GroupAdmin", "Admin"].includes(currentUser?.role)) ||
      (activePage === "assets" && !canManageHotelSettings) ||
      (activePage === "audit-logs" && !canManageHotelSettings) ||
      (activePage === "problem-types" && !canManageHotelSettings) ||
      (activePage === "departments" && !canManageDepartments)
    ) {
      return "dashboard";
    }

    if (activePage === "request-users" && canManageUsers) {
      return "user-management";
    }

    return activePage;
  }, [activePage, canManageDepartments, canManageHotelSettings, canManageUsers, currentUser?.role]);

  const currentPageMeta = getPageMeta(visibleActivePage, language);
  const pendingDeleteUser = userActions.users.find(
    (user) => user._id === userActions.deleteUserId || user.id === userActions.deleteUserId,
  );
  const { filteredTickets, ticketsPerPage } = useTicketFilters({
    currentPage,
    filterStatus,
    search,
    tickets: ticketActions.tickets,
  });

  const resetShellState = useCallback(() => {
    resetTickets();
    resetUsers();
    setHotels([]);
    setDepartments([]);
    setSelectedHotelId("all");
    setSearch("");
    setFilterStatus("all");
    setFilterPriority("all");
    setCurrentPage(1);
  }, [resetTickets, resetUsers]);

  const handleLogin = async (loginForm) => {
    const didLogin = await login(loginForm);
    if (didLogin) {
      resetTickets();
      setHotels([]);
      setDepartments([]);
    }
    return didLogin;
  };

  const handleGoogleLogin = async (credential) => {
    const didLogin = await googleLogin(credential);
    if (didLogin) {
      resetTickets();
      setHotels([]);
      setDepartments([]);
    }
    return didLogin;
  };

  const handleLogout = useCallback(() => {
    logout();
    resetShellState();
  }, [logout, resetShellState]);

  const changeMyPassword = async (passwordForm, validationMessage) => {
    const didChange = await auth.changeMyPassword(passwordForm, validationMessage);
    if (didChange) {
      resetShellState();
    }
    return didChange;
  };

  const updateProfile = async (profileForm, validationMessage) => {
    const didUpdate = await updateMyProfile(profileForm, validationMessage);
    if (didUpdate) {
      await userActions.fetchUsers();
    }
    return didUpdate;
  };

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleFilterStatusChange = useCallback((value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  }, []);

  const handleFilterPriorityChange = useCallback((value) => {
    setFilterPriority(value);
    setCurrentPage(1);
  }, []);

  const handleSelectedHotelChange = useCallback((value) => {
    setSelectedHotelId(value);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    if (currentUser?.mustChangePassword) return undefined;
    if (isPendingHotelAssignment(currentUser)) {
      setLoading(false);
      return undefined;
    }

    let ignore = false;

    const loadInitialData = async () => {
      if (!currentUser) {
        const currentUserResult = await axios
          .get(`${AUTH_URL}/me`, { headers: authHeaders })
          .then((res) => res.data)
          .catch((error) => {
            console.error("Failed to fetch current user", error);
            return null;
          });

        if (ignore) return;

        if (currentUserResult) {
          setCurrentUser(currentUserResult);
          localStorage.setItem("user", JSON.stringify(currentUserResult));
        }
        setLoading(false);
        return;
      }

      const [
        usersResult,
        hotelsResult,
        departmentsResult,
        ticketsResult,
        summaryTicketsResult,
      ] = await Promise.all([
        canManageTickets
          ? axios
              .get(`${AUTH_URL}/users`, { headers: authHeaders, params: scopedParams })
              .then((res) => res.data)
              .catch((error) => {
                console.error("Failed to fetch users", error);
                return null;
              })
          : Promise.resolve([]),
        getHotels(token, { includeInactive: true }).catch((error) => {
          console.error("Failed to fetch hotels", error);
          return null;
        }),
        getDepartments(token, scopedParams).catch((error) => {
          console.error("Failed to fetch departments", error);
          return null;
        }),
        axios
          .get(API_URL, { headers: authHeaders, params: ticketListParams })
          .then((res) => (Array.isArray(res.data) ? res.data : res.data.data || []))
          .catch((error) => {
            console.error("Failed to fetch tickets", error);
            toast.error(getErrorMessage(error, "Failed to fetch tickets"));
            return null;
          }),
        axios
          .get(`${API_URL}/summary`, { headers: authHeaders, params: scopedParams })
          .then((res) => res.data)
          .catch((error) => {
            console.error("Failed to fetch ticket summary", error);
            toast.error(getErrorMessage(error, "Failed to fetch ticket summary"));
            return null;
          }),
      ]);

      if (ignore) return;

      if (usersResult) setUsers(usersResult);
      if (hotelsResult) setHotels(hotelsResult);
      if (departmentsResult) setDepartments(departmentsResult);
      if (ticketsResult) setTickets(ticketsResult);
      if (summaryTicketsResult) setSummaryTickets(summaryTicketsResult);
      setLoading(false);
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, [
    authHeaders,
    canManageTickets,
    currentUser,
    scopedParams,
    setCurrentUser,
    ticketListParams,
    token,
    setSummaryTickets,
    setTickets,
    setUsers,
  ]);

  useEffect(() => {
    if (!effectiveSelectedHotelId) return;
    localStorage.setItem("selectedHotelId", effectiveSelectedHotelId);
  }, [effectiveSelectedHotelId]);

  useEffect(() => {
    persistLanguage(language);
  }, [language]);

  if (!token) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage onGoogleLogin={handleGoogleLogin} onLogin={handleLogin} />
      </>
    );
  }

  if (currentUser?.mustChangePassword) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <Toaster position="top-right" />
        <div className="ops-force-pw-container">
          <div className="mx-auto max-w-3xl">
            <Suspense fallback={<PageLoading />}>
              <ProfilePage
                changingPassword={changingPassword}
                currentUser={currentUser}
                forcePasswordChange
                initialSection="password"
                onChangePassword={changeMyPassword}
                onUpdateProfile={updateProfile}
                savingProfile={savingProfile}
                departments={departments}
              />
            </Suspense>
            <button
              type="button"
              onClick={handleLogout}
              className="mx-auto mt-4 block text-sm font-bold text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isPendingHotelAssignment(currentUser)) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <Toaster position="top-right" />
        <PendingHotelAssignmentPage currentUser={currentUser} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <Toaster position="top-right" />
      <ConfirmModal
        open={!!ticketActions.deleteId}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
        onCancel={() => ticketActions.setDeleteId(null)}
        onConfirm={ticketActions.confirmDeleteTicket}
      />
      <ConfirmModal
        open={!!userActions.deleteUserId}
        title="Delete User"
        message={`Are you sure you want to delete ${
          pendingDeleteUser?.name || "this user"
        }? This account will no longer be able to access the system.`}
        onCancel={() => userActions.setDeleteUserId(null)}
        onConfirm={userActions.confirmDeleteUser}
      />
      <ConfirmModal
        confirmLabel={t("common.closeTicket")}
        confirmDisabled={!ticketActions.adminCloseReason.trim()}
        open={!!ticketActions.pendingAdminClose}
        title={t("common.closeTicketAsAdmin")}
        message={t("common.adminCloseMessage", {
          title: ticketActions.pendingAdminClose?.title || t("common.closeTicket"),
        })}
        onCancel={() => {
          ticketActions.setPendingAdminClose(null);
          ticketActions.setAdminCloseReason("");
        }}
        onConfirm={ticketActions.confirmAdminCloseTicket}
      >
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200" htmlFor="admin-close-reason">
          {t("common.adminCloseReason")}
        </label>
        <textarea
          id="admin-close-reason"
          className="ops-input mt-2 min-h-28 resize-y"
          maxLength={500}
          onChange={(event) => ticketActions.setAdminCloseReason(event.target.value)}
          placeholder={t("common.adminCloseReasonPlaceholder")}
          value={ticketActions.adminCloseReason}
        />
        <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {ticketActions.adminCloseReason.trim().length}/500
        </p>
      </ConfirmModal>
      <TicketDetailModal
        open={!!ticketActions.selectedTicket}
        ticket={ticketActions.selectedTicket}
        currentUser={currentUser}
        onClose={ticketActions.closeTicketDetails}
        onComment={ticketActions.addTicketComment}
        onSatisfaction={ticketActions.submitTicketSatisfaction}
        onUploadAttachment={ticketActions.uploadTicketAttachment}
        canUploadAttachment={ticketActions.canUploadSelectedTicketAttachment}
        canManageTickets={canManageTickets}
        onUpdatePriority={ticketActions.updateTicketPriority}
        t={t}
      />
      <div className="ops-shell">
        <div className="ops-frame">
          <Sidebar
            activePage={visibleActivePage}
            currentUser={currentUser}
            onNavigate={setActivePage}
            onLogout={handleLogout}
            onOpenPassword={() => openProfilePage("password")}
            onOpenProfile={() => openProfilePage("profile")}
            t={t}
          />
          <main className="ops-main">
            <TopBar
              activeHotelContext={activeHotelContext}
              canSelectHotel={canSelectHotel}
              currentPageMeta={currentPageMeta}
              darkMode={darkMode}
              hotels={selectableHotels}
              language={language}
              onOpenNotificationTicket={ticketActions.openNotificationTicket}
              onRealtimeNotification={ticketActions.syncTicketsFromRealtime}
              onRealtimeSync={ticketActions.syncTicketsFromRealtime}
              onSelectedHotelChange={handleSelectedHotelChange}
              onToggleDarkMode={() => setDarkMode((current) => !current)}
              onToggleLanguage={() => setLanguage((current) => (current === "th" ? "en" : "th"))}
              selectedHotelId={effectiveSelectedHotelId}
              shouldShowDashboardHotelChip={shouldShowDashboardHotelChip}
              t={t}
              token={token}
              visibleActivePage={visibleActivePage}
            />

            <Suspense fallback={<PageLoading />}>
              <PageRouter
                addTicketComment={ticketActions.addTicketComment}
                assignTicket={ticketActions.assignTicket}
                assigningTicketId={ticketActions.assigningTicketId}
                canAssignTickets={canAssignTickets}
                canManageDepartments={canManageDepartments}
                canManageHotelSettings={canManageHotelSettings}
                canManageUsers={canManageUsers}
                changeMyPassword={changeMyPassword}
                changingPassword={changingPassword}
                claimTicket={ticketActions.claimTicket}
                createUser={userActions.createUser}
                currentPage={currentPage}
                currentUser={currentUser}
                darkMode={darkMode}
                deleteTicket={ticketActions.deleteTicket}
                deletingTicketId={ticketActions.deletingTicketId}
                deletingUserId={userActions.deletingUserId}
                deleteUser={userActions.deleteUser}
                departments={departments}
                fetchDepartments={fetchDepartments}
                fetchHotels={fetchHotels}
                filteredTickets={filteredTickets}
                filterPriority={filterPriority}
                filterStatus={filterStatus}
                form={ticketActions.form}
                handleFilterPriorityChange={handleFilterPriorityChange}
                handleFilterStatusChange={handleFilterStatusChange}
                handleSearchChange={handleSearchChange}
                handleSelectedHotelChange={handleSelectedHotelChange}
                handleSubmit={ticketActions.handleSubmit}
                allHotels={hotels}
                hotels={selectableHotels}
                loading={loading}
                openTicketDetails={ticketActions.openTicketDetails}
                profileInitialSection={profileInitialSection}
                reopenTicket={ticketActions.reopenTicket}
                savingProfile={savingProfile}
                savingUser={userActions.savingUser}
                search={search}
                selectedHotelId={effectiveSelectedHotelId}
                setActivePage={setActivePage}
                setCurrentPage={setCurrentPage}
                setForm={ticketActions.setForm}
                submitting={ticketActions.submitting}
                summaryTickets={ticketActions.summaryTickets}
                t={t}
                ticketsPerPage={ticketsPerPage}
                token={token}
                updateMyProfile={updateProfile}
                updateStatus={ticketActions.updateStatus}
                updateTicketDueDate={ticketActions.updateTicketDueDate}
                updateTicketPriority={ticketActions.updateTicketPriority}
                updatingTicketId={ticketActions.updatingTicketId}
                updateUser={userActions.updateUser}
                users={userActions.users}
                visibleActivePage={visibleActivePage}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

function PendingHotelAssignmentPage({ currentUser, onLogout }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#06181c] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_18%_0%,rgba(45,212,191,0.18),transparent_56%),linear-gradient(155deg,#061417_0%,#0a1f23_48%,#123237_100%)]" />
      <div className="relative w-full max-w-lg rounded-xl border border-white/25 bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(9,5,20,0.46)] backdrop-blur-xl">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#0a1f23] text-teal-50 shadow-[0_12px_32px_rgba(6,24,28,0.38)] ring-1 ring-white/25">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-700">
          Account pending setup
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          Waiting for hotel assignment
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your Gmail account {currentUser?.email ? `(${currentUser.email}) ` : ""}
          has been created. Please ask an administrator to assign your hotel before you can view data or create tickets.
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="ops-button-primary mt-6 w-full py-3"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="ops-page-loading">
      <div className="ops-surface px-6 py-4 text-sm font-semibold text-slate-700 dark:text-teal-50">
        {createTranslator(getInitialLanguage())("common.loadingPage")}
      </div>
    </div>
  );
}

export default App;
