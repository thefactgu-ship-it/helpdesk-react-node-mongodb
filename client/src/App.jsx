import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import toast, { Toaster } from "react-hot-toast";
import ConfirmModal from "./components/ConfirmModal";
import LoginPage from "./components/LoginPage";
import NotificationBell from "./components/NotificationBell";
import ThemedSelect from "./components/ThemedSelect";
import TicketDetailModal from "./components/TicketDetailModal";
import {
  adminRoles,
  groupRoles,
  pageTitles,
  ticketManagerRoles,
} from "./config/appConfig";
import { useTicketFilters } from "./hooks/useTicketFilters";
import { API_BASE_URL } from "./services/api";
import { getHotels } from "./services/hotelService";
import { getDepartments } from "./services/departmentService";

const AddTicketPage = lazy(() => import("./pages/AddTicketPage"));
const AssetManagementPage = lazy(() => import("./pages/AssetManagementPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const DepartmentManagementPage = lazy(() => import("./pages/DepartmentManagementPage"));
const HotelManagementPage = lazy(() => import("./pages/HotelManagementPage"));
const MonthlyReportPage = lazy(() => import("./pages/MonthlyReportPage"));
const ProblemTypesPage = lazy(() => import("./pages/ProblemTypesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const QuarterlyYearlyPage = lazy(() => import("./pages/QuarterlyYearlyPage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const UserManagementPage = lazy(() => import("./pages/UserManagementPage"));

const API_URL = `${API_BASE_URL}/tickets`;
const AUTH_URL = `${API_BASE_URL}/auth`;
const attachmentsEnabled = import.meta.env.VITE_ATTACHMENTS_ENABLED === "true";

function getErrorMessage(error, fallback) {
  const validationMessage = error?.response?.data?.errors?.[0]?.message;
  return validationMessage || error?.response?.data?.message || error?.message || fallback;
}

function getEntityId(entity) {
  if (typeof entity === "string") return entity;
  return String(entity?._id || entity?.id || "");
}

function getUserHotelAccessIds(user) {
  return [
    getEntityId(user?.hotelId),
    ...(Array.isArray(user?.hotelAccess) ? user.hotelAccess.map(getEntityId) : []),
  ].filter(Boolean);
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(
    localStorage.getItem("selectedHotelId") || "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [tickets, setTickets] = useState([]);
  const [summaryTickets, setSummaryTickets] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [deletingTicketId, setDeletingTicketId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [profileInitialSection, setProfileInitialSection] = useState("profile");
  const [form, setForm] = useState({
    title: "",
    description: "",
    requester: "",
    requesterUserId: "",
    category: "",
    department: "IT",
    departmentId: "",
    priority: "medium",
    criticalRequested: false,
    assignedTo: "",
    dueDate: "",
  });

  const authHeaders = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    [token],
  );
  const scopedParams = useMemo(() => {
    if (!selectedHotelId || selectedHotelId === "all") return {};
    return { hotelId: selectedHotelId };
  }, [selectedHotelId]);

  const fetchTickets = useCallback(async () => {
    if (!token) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(API_URL, {
        headers: authHeaders,
        params: scopedParams,
      });
      setTickets(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
      toast.error(getErrorMessage(error, "Failed to fetch tickets"));
    } finally {
      setLoading(false);
    }
  }, [authHeaders, scopedParams, token]);

  const fetchSummaryTickets = useCallback(async () => {
    if (!token) {
      setSummaryTickets([]);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/summary`, {
        headers: authHeaders,
        params: scopedParams,
      });
      setSummaryTickets(res.data);
    } catch (error) {
      console.error("Failed to fetch ticket summary", error);
      toast.error(getErrorMessage(error, "Failed to fetch ticket summary"));
    }
  }, [authHeaders, scopedParams, token]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;

    try {
      const res = await axios.get(`${AUTH_URL}/users`, {
        headers: authHeaders,
        params: scopedParams,
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  }, [authHeaders, scopedParams, token]);

  const fetchHotels = useCallback(async () => {
    if (!token) {
      setHotels([]);
      return;
    }

    try {
      const data = await getHotels(token);
      setHotels(data);
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

  const handleLogin = async (loginForm) => {
    try {
      const res = await axios.post(`${AUTH_URL}/login`, loginForm);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setTickets([]);
      setSummaryTickets([]);
      setHotels([]);
      setDepartments([]);
      toast.success("Login successful");
      return true;
    } catch (error) {
      console.error("Login failed", error);
      toast.error(getErrorMessage(error, "Login failed"));
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setCurrentUser(null);
    setTickets([]);
    setSummaryTickets([]);
    setUsers([]);
    setHotels([]);
    localStorage.removeItem("selectedHotelId");
    setSelectedHotelId("all");
    setSearch("");
    setFilterStatus("all");
    setCurrentPage(1);
    setActivePage("dashboard");
    toast.success("Logged out");
  };

  const openProfilePage = (section = "profile") => {
    setProfileInitialSection(section);
    setActivePage("profile");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requesterName = form.requester.trim() || currentUser?.name || "";
    const requesterUserId =
      form.requesterUserId ||
      (currentUser?.role === "User" ? currentUser?._id || currentUser?.id || "" : "");
    const userDepartmentId = currentUser?.departmentId?._id || currentUser?.departmentId || "";
    const selectedDepartment = departments.find(
      (department) =>
        (department._id || department.id) === (form.departmentId || userDepartmentId) ||
        department.name === form.department ||
        department.name === currentUser?.departmentName ||
        department.name === currentUser?.team,
    );
    const departmentId = form.departmentId || selectedDepartment?._id || selectedDepartment?.id || "";
    const departmentName =
      form.department.trim() ||
      selectedDepartment?.name ||
      currentUser?.departmentName ||
      currentUser?.team ||
      "IT";
    const criticalRequested = !canManageTickets && Boolean(form.criticalRequested);
    const priority = canManageTickets
      ? form.priority || "medium"
      : criticalRequested
        ? "high"
        : "medium";

    if (!form.title.trim()) {
      toast.error("Ticket title is required");
      return;
    }
    if (form.title.trim().length < 5) {
      toast.error("Title must be at least 5 characters");
      return;
    }
    if (!requesterUserId && !requesterName) {
      toast.error("Requester is required");
      return;
    }
    if (!requesterUserId && requesterName.length < 2) {
      toast.error("Requester must be at least 2 characters");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Issue category is required");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        API_URL,
        {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          requester: requesterName,
          requesterUserId: requesterUserId || undefined,
          category: form.category.trim(),
          departmentId: departmentId || undefined,
          department: departmentName,
          priority,
          criticalRequested,
          assignedTo: canManageTickets ? form.assignedTo || undefined : undefined,
          dueDate: canManageTickets ? form.dueDate || undefined : undefined,
          hotelId: selectedHotelId !== "all" ? selectedHotelId : undefined,
        },
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success("Ticket added successfully");
      setForm({
        title: "",
        description: "",
        requester: "",
        requesterUserId: "",
        category: "",
        department: "IT",
        departmentId: "",
        priority: "medium",
        criticalRequested: false,
        assignedTo: "",
        dueDate: "",
      });
      await fetchTickets();
      await fetchSummaryTickets();
    } catch (error) {
      console.error("Failed to create ticket", error);
      toast.error(getErrorMessage(error, "Failed to create ticket"));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    if (!canManageTickets && currentUser?.role !== "Agent") {
      toast.error("Only assigned agents, managers, or admins can update ticket status");
      return;
    }

    try {
      setUpdatingTicketId(id);
      await axios.patch(
        `${API_URL}/${id}/status`,
        { status },
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success("Status updated");
      await fetchTickets();
      await fetchSummaryTickets();
      if (selectedTicket && selectedTicket._id === id) {
        await openTicketDetails(id);
      }
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error(getErrorMessage(error, "Failed to update status"));
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const assignTicket = async (id, assignedTo) => {
    if (!assignedTo) return;
    if (!canManageTickets) return;

    try {
      setAssigningTicketId(id);
      await axios.patch(
        `${API_URL}/${id}/assign`,
        { assignedTo },
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success("Ticket assigned");
      await fetchTickets();
      await fetchSummaryTickets();
      if (selectedTicket && selectedTicket._id === id) {
        await openTicketDetails(id);
      }
    } catch (error) {
      console.error("Failed to assign ticket", error);
      toast.error(getErrorMessage(error, "Failed to assign ticket"));
    } finally {
      setAssigningTicketId(null);
    }
  };

  const openTicketDetails = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/${id}`, {
        headers: authHeaders,
        params: scopedParams,
      });
      setSelectedTicket(res.data);
    } catch (error) {
      console.error("Failed to load ticket details", error);
      toast.error(getErrorMessage(error, "Failed to load ticket details"));
    }
  };

  const closeTicketDetails = () => {
    setSelectedTicket(null);
  };

  const openNotificationTicket = async (ticketId) => {
    setActivePage("tickets");
    await openTicketDetails(ticketId);
  };

  const addTicketComment = async (ticketId, text) => {
    try {
      await axios.post(
        `${API_URL}/${ticketId}/comment`,
        { text },
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success("Comment added");
      await fetchTickets();
      await fetchSummaryTickets();
      await openTicketDetails(ticketId);
    } catch (error) {
      console.error("Failed to add comment", error);
      toast.error(getErrorMessage(error, "Failed to add comment"));
    }
  };

  const submitTicketSatisfaction = async (ticketId, payload) => {
    try {
      await axios.patch(
        `${API_URL}/${ticketId}/satisfaction`,
        payload,
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success("Satisfaction submitted");
      await fetchTickets();
      await fetchSummaryTickets();
      await openTicketDetails(ticketId);
      return true;
    } catch (error) {
      console.error("Failed to submit satisfaction", error);
      toast.error(getErrorMessage(error, "Failed to submit satisfaction"));
      return false;
    }
  };

  const uploadTicketAttachment = async (ticketId, file) => {
    if (!canUploadSelectedTicketAttachment) {
      toast.error("Only assigned agents, managers, or admins can upload attachments");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(`${API_URL}/${ticketId}/attachments`, formData, {
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data",
        },
        params: scopedParams,
      });
      toast.success("Attachment uploaded");
      await fetchTickets();
      await fetchSummaryTickets();
      await openTicketDetails(ticketId);
    } catch (error) {
      console.error("Failed to upload attachment", error);
      toast.error(getErrorMessage(error, "Failed to upload attachment"));
    }
  };

  const confirmDeleteTicket = async () => {
    try {
      setDeletingTicketId(deleteId);
      await axios.delete(`${API_URL}/${deleteId}`, {
        headers: authHeaders,
        params: scopedParams,
      });
      toast.success("Ticket deleted");
      setDeleteId(null);
      await fetchTickets();
      await fetchSummaryTickets();
    } catch (error) {
      console.error("Failed to delete ticket", error);
      toast.error(getErrorMessage(error, "Failed to delete ticket"));
    } finally {
      setDeletingTicketId(null);
    }
  };

  const deleteTicket = (id) => {
    setDeleteId(id);
  };

  const createUser = async (userForm) => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error("Name, email, and password are required");
      return false;
    }

    try {
      setSavingUser(true);
      await axios.post(`${AUTH_URL}/users`, {
        ...userForm,
        hotelId: userForm.hotelId || (selectedHotelId !== "all" ? selectedHotelId : undefined),
      }, {
        headers: authHeaders,
        params: scopedParams,
      });
      toast.success("User created");
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Failed to create user", error);
      toast.error(getErrorMessage(error, "Failed to create user"));
      return false;
    } finally {
      setSavingUser(false);
    }
  };

  const updateMyProfile = async (profileForm, validationMessage) => {
    if (validationMessage) {
      toast.error(validationMessage);
      return false;
    }

    if (!profileForm) return false;

    try {
      setSavingProfile(true);
      const res = await axios.patch(`${AUTH_URL}/me`, profileForm, {
        headers: authHeaders,
      });
      setCurrentUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      toast.success("Profile updated");
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error(getErrorMessage(error, "Failed to update profile"));
      return false;
    } finally {
      setSavingProfile(false);
    }
  };

  const changeMyPassword = async (passwordForm, validationMessage) => {
    if (validationMessage) {
      toast.error(validationMessage);
      return false;
    }

    if (!passwordForm) return false;

    try {
      setChangingPassword(true);
      await axios.patch(`${AUTH_URL}/me/password`, passwordForm, {
        headers: authHeaders,
      });
      toast.success("Password updated. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setCurrentUser(null);
      setTickets([]);
      setSummaryTickets([]);
      setUsers([]);
      setDepartments([]);
      setSearch("");
      setFilterStatus("all");
      setCurrentPage(1);
      setActivePage("dashboard");
      return true;
    } catch (error) {
      console.error("Failed to update password", error);
      toast.error(getErrorMessage(error, "Failed to update password"));
      return false;
    } finally {
      setChangingPassword(false);
    }
  };

  const updateUser = async (id, userForm) => {
    if (!userForm.name || !userForm.email) {
      toast.error("Name and email are required");
      return false;
    }

    try {
      setSavingUser(true);
      const res = await axios.patch(`${AUTH_URL}/users/${id}`, userForm, {
        headers: authHeaders,
        params: scopedParams,
      });

      if (currentUser && (currentUser.id === id || currentUser._id === id)) {
        setCurrentUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      }

      toast.success("User updated");
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Failed to update user", error);
      toast.error(getErrorMessage(error, "Failed to update user"));
      return false;
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = (id) => {
    setDeleteUserId(id);
  };

  const confirmDeleteUser = async () => {
    try {
      setDeletingUserId(deleteUserId);
      await axios.delete(`${AUTH_URL}/users/${deleteUserId}`, {
        headers: authHeaders,
        params: scopedParams,
      });
      toast.success("User deleted");
      setDeleteUserId(null);
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error(getErrorMessage(error, "Failed to delete user"));
      return false;
    } finally {
      setDeletingUserId(null);
    }
  };

  const isAdmin = adminRoles.includes(currentUser?.role);
  const canManageTickets = ticketManagerRoles.includes(currentUser?.role);
  const accessibleHotelIds = [...new Set(getUserHotelAccessIds(currentUser))];
  const canSelectHotel =
    hotels.length > 1 &&
    (groupRoles.includes(currentUser?.role) || accessibleHotelIds.length > 1);
  const canUploadSelectedTicketAttachment =
    attachmentsEnabled &&
    (canManageTickets ||
      (currentUser?.role === "Agent" &&
        getEntityId(selectedTicket?.assignedTo) === getEntityId(currentUser)));

  const visibleActivePage = useMemo(() => {
    if (
      (activePage === "user-management" && !isAdmin) ||
      (activePage === "request-users" && !isAdmin) ||
      (activePage === "hotels" && !["GroupAdmin", "Admin"].includes(currentUser?.role)) ||
      (activePage === "departments" && !ticketManagerRoles.includes(currentUser?.role))
    ) {
      return "dashboard";
    }

    if (activePage === "request-users" && isAdmin) {
      return "user-management";
    }

    return activePage;
  }, [activePage, currentUser?.role, isAdmin]);

  const currentPageMeta = pageTitles[visibleActivePage] || pageTitles.dashboard;
  const pendingDeleteUser = users.find(
    (user) => user._id === deleteUserId || user.id === deleteUserId,
  );
  const { paginatedTickets, totalPages } = useTicketFilters({
    currentPage,
    filterStatus,
    search,
    tickets,
  });

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleFilterStatusChange = useCallback((value) => {
    setFilterStatus(value);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    let ignore = false;

    const loadInitialData = async () => {
      const [
        currentUserResult,
        usersResult,
        hotelsResult,
        departmentsResult,
        ticketsResult,
        summaryTicketsResult,
      ] = await Promise.all([
        currentUser
          ? Promise.resolve(null)
          : axios
              .get(`${AUTH_URL}/me`, { headers: authHeaders })
              .then((res) => res.data)
              .catch((error) => {
                console.error("Failed to fetch current user", error);
                return null;
              }),
        axios
          .get(`${AUTH_URL}/users`, { headers: authHeaders, params: scopedParams })
          .then((res) => res.data)
          .catch((error) => {
            console.error("Failed to fetch users", error);
            return null;
          }),
        getHotels(token).catch((error) => {
          console.error("Failed to fetch hotels", error);
          return null;
        }),
        getDepartments(token, scopedParams).catch((error) => {
          console.error("Failed to fetch departments", error);
          return null;
        }),
        axios
          .get(API_URL, { headers: authHeaders, params: scopedParams })
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

      if (currentUserResult) {
        setCurrentUser(currentUserResult);
        localStorage.setItem("user", JSON.stringify(currentUserResult));
      }
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
  }, [authHeaders, currentUser, scopedParams, token]);

  useEffect(() => {
    if (!selectedHotelId) return;
    localStorage.setItem("selectedHotelId", selectedHotelId);
  }, [selectedHotelId]);

  if (!token) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <Toaster position="top-right" />
      <ConfirmModal
        open={!!deleteId}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDeleteTicket}
      />
      <ConfirmModal
        open={!!deleteUserId}
        title="Delete User"
        message={`Are you sure you want to delete ${
          pendingDeleteUser?.name || "this user"
        }? This account will no longer be able to access the system.`}
        onCancel={() => setDeleteUserId(null)}
        onConfirm={confirmDeleteUser}
      />
      <TicketDetailModal
        open={!!selectedTicket}
        ticket={selectedTicket}
        currentUser={currentUser}
        onClose={closeTicketDetails}
        onComment={addTicketComment}
        onSatisfaction={submitTicketSatisfaction}
        onUploadAttachment={uploadTicketAttachment}
        canUploadAttachment={canUploadSelectedTicketAttachment}
      />
      <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white md:p-6">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col bg-white dark:bg-slate-900 md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-2xl md:border md:border-slate-200 md:shadow-xl md:dark:border-slate-800 md:flex-row">
          <Sidebar
            activePage={visibleActivePage}
            currentUser={currentUser}
            onNavigate={setActivePage}
            onLogout={handleLogout}
            onOpenPassword={() => openProfilePage("password")}
            onOpenProfile={() => openProfilePage("profile")}
          />
          <main className="min-h-[calc(100vh-3rem)] flex-1 bg-slate-50/90 p-4 pb-28 dark:bg-slate-900 md:p-6">
            <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{currentPageMeta.title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {currentPageMeta.subtitle}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="self-start sm:self-auto">
                  <NotificationBell
                    token={token}
                    onOpenTicket={openNotificationTicket}
                  />
                </div>
                {canSelectHotel && (
                  <ThemedSelect
                    className="w-full min-w-[15rem] sm:w-72"
                    value={selectedHotelId}
                    onChange={setSelectedHotelId}
                    variant="pill"
                    options={[
                      { value: "all", label: "All Hotels", meta: "Group dashboard", prefix: "ALL" },
                      ...hotels.map((hotel) => ({
                        value: hotel._id || hotel.id,
                        label: `${hotel.code} / ${hotel.name}`,
                        meta: hotel.region || "Hotel",
                        prefix: String(hotel.code || hotel.name || "HT").slice(0, 2),
                      })),
                    ]}
                  />
                )}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="rounded-full border border-blue-200 bg-white px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-200 dark:hover:border-blue-400 dark:hover:bg-slate-800"
                >
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </button>
              </div>
            </header>

            <Suspense fallback={<PageLoading />}>
              {visibleActivePage === "dashboard" && (
                <DashboardPage
                  darkMode={darkMode}
                  loading={loading}
                  tickets={summaryTickets}
                />
              )}

              {visibleActivePage === "tickets" && (
                <TicketsPage
                  assigningTicketId={assigningTicketId}
                  assignTicket={assignTicket}
                  tickets={paginatedTickets}
                  loading={loading}
                  search={search}
                  setSearch={handleSearchChange}
                  filterStatus={filterStatus}
                  setFilterStatus={handleFilterStatusChange}
                  updatingTicketId={updatingTicketId}
                  deletingTicketId={deletingTicketId}
                  updateStatus={updateStatus}
                  deleteTicket={deleteTicket}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalPages={totalPages}
                  onViewTicket={openTicketDetails}
                  currentUser={currentUser}
                  users={users}
                />
              )}

              {visibleActivePage === "add-ticket" && (
                <AddTicketPage
                  canAssignTickets={canManageTickets}
                  form={form}
                  setForm={setForm}
                  handleSubmit={handleSubmit}
                  submitting={submitting}
                  users={users}
                  token={token}
                  hotelId={selectedHotelId}
                  currentUser={currentUser}
                  departments={departments}
                />
              )}

              {visibleActivePage === "monthly-report" && (
                <MonthlyReportPage
                  hotels={hotels}
                  selectedHotelId={selectedHotelId}
                  tickets={summaryTickets}
                />
              )}

              {visibleActivePage === "quarterly-report" && (
                <QuarterlyYearlyPage
                  hotels={hotels}
                  selectedHotelId={selectedHotelId}
                  tickets={summaryTickets}
                />
              )}

              {visibleActivePage === "assets" && (
                <AssetManagementPage
                  currentUser={currentUser}
                  hotelId={selectedHotelId}
                  token={token}
                />
              )}

              {visibleActivePage === "departments" && ticketManagerRoles.includes(currentUser?.role) && (
                <DepartmentManagementPage
                  departments={departments}
                  hotels={hotels}
                  onDepartmentsChange={fetchDepartments}
                  selectedHotelId={selectedHotelId}
                  token={token}
                />
              )}

              {visibleActivePage === "hotels" && ["GroupAdmin", "Admin"].includes(currentUser?.role) && (
                <HotelManagementPage
                  hotels={hotels}
                  onHotelsChange={fetchHotels}
                  token={token}
                />
              )}

              {visibleActivePage === "user-management" && isAdmin && (
                <UserManagementPage
                  currentUser={currentUser}
                  deletingUserId={deletingUserId}
                  onCreateUser={createUser}
                  onDeleteUser={deleteUser}
                  onUpdateUser={updateUser}
                  savingUser={savingUser}
                  users={users}
                  departments={departments}
                  hotels={hotels}
                  selectedHotelId={selectedHotelId}
                />
              )}

              {visibleActivePage === "problem-types" && (
                <ProblemTypesPage
                  currentUser={currentUser}
                  hotelId={selectedHotelId}
                  token={token}
                />
              )}

              {visibleActivePage === "profile" && (
                <ProfilePage
                  changingPassword={changingPassword}
                  currentUser={currentUser}
                  initialSection={profileInitialSection}
                  onChangePassword={changeMyPassword}
                  onUpdateProfile={updateMyProfile}
                  savingProfile={savingProfile}
                  departments={departments}
                />
              )}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex min-h-[24rem] items-center justify-center">
      <div className="rounded-2xl border border-blue-100 bg-white px-6 py-4 text-sm font-semibold text-blue-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-blue-200">
        Loading page...
      </div>
    </div>
  );
}

export default App;
