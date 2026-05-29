import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { Building2 } from "lucide-react";
import Sidebar from "./components/Sidebar";
import toast, { Toaster } from "react-hot-toast";
import ConfirmModal from "./components/ConfirmModal";
import LoginPage from "./components/LoginPage";
import NotificationBell from "./components/NotificationBell";
import ThemedSelect from "./components/ThemedSelect";
import TicketDetailModal from "./components/TicketDetailModal";
import { Button } from "./components/ui";
import { groupRoles } from "./config/appConfig";
import {
  canAssignTickets as roleCanAssignTickets,
  canManageDepartments as roleCanManageDepartments,
  canManageHotelSettings as roleCanManageHotelSettings,
  canManageTickets as roleCanManageTickets,
  canManageUsers as roleCanManageUsers,
} from "./config/rolePolicy";
import { useTicketFilters } from "./hooks/useTicketFilters";
import {
  createTranslator,
  getInitialLanguage,
  getPageMeta,
  persistLanguage,
} from "./i18n";
import { API_BASE_URL } from "./services/api";
import { getHotels } from "./services/hotelService";
import { getDepartments } from "./services/departmentService";
import { lazyWithDeployRetry } from "./utils/lazyWithDeployRetry";

const AddTicketPage = lazyWithDeployRetry(() => import("./pages/AddTicketPage"));
const AssetManagementPage = lazyWithDeployRetry(() => import("./pages/AssetManagementPage"));
const AuditLogsPage = lazyWithDeployRetry(() => import("./pages/AuditLogsPage"));
const DashboardPage = lazyWithDeployRetry(() => import("./pages/DashboardPage"));
const DepartmentManagementPage = lazyWithDeployRetry(() => import("./pages/DepartmentManagementPage"));
const HotelManagementPage = lazyWithDeployRetry(() => import("./pages/HotelManagementPage"));
const MonthlyReportPage = lazyWithDeployRetry(() => import("./pages/MonthlyReportPage"));
const ProblemTypesPage = lazyWithDeployRetry(() => import("./pages/ProblemTypesPage"));
const ProfilePage = lazyWithDeployRetry(() => import("./pages/ProfilePage"));
const QuarterlyYearlyPage = lazyWithDeployRetry(() => import("./pages/QuarterlyYearlyPage"));
const TicketsPage = lazyWithDeployRetry(() => import("./pages/TicketsPage"));
const UserManagementPage = lazyWithDeployRetry(() => import("./pages/UserManagementPage"));

const API_URL = `${API_BASE_URL}/tickets`;
const AUTH_URL = `${API_BASE_URL}/auth`;
const attachmentsEnabled = import.meta.env.VITE_ATTACHMENTS_ENABLED === "true";
const dashboardHotelChipRoles = new Set(["User", "Manager", "Agent"]);

function getErrorMessage(error, fallback) {
  const validationMessage = error?.response?.data?.errors?.[0]?.message;
  return validationMessage || error?.response?.data?.message || error?.message || fallback;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
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

function findHotelById(hotels, hotelId) {
  if (!hotelId) return null;
  return hotels.find((hotel) => getEntityId(hotel) === String(hotelId)) || null;
}

function formatHotelName(hotel) {
  if (!hotel) return "";
  if (typeof hotel === "string") return hotel;
  return [hotel.code, hotel.name].filter(Boolean).join(" / ") || getEntityId(hotel);
}

function getHotelMeta(hotel, fallback) {
  if (!hotel || typeof hotel === "string") return fallback;
  return hotel.region || hotel.timezone || fallback;
}

function getTextByLanguage(language, thaiText, englishText) {
  return language === "th" ? thaiText : englishText;
}

function translateOr(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

function getActiveHotelContext({ currentUser, hotels, language, selectedHotelId, t }) {
  const eyebrow = getTextByLanguage(language, "โรงแรมที่ใช้งาน", "Current hotel");
  const hotelFallback = getTextByLanguage(language, "ยังไม่ระบุโรงแรม", "No hotel assigned");
  const currentScope = getTextByLanguage(language, "ขอบเขตปัจจุบัน", "Current scope");
  const primaryHotelId = getEntityId(currentUser?.hotelId);
  const selectedHotel = selectedHotelId && selectedHotelId !== "all"
    ? findHotelById(hotels, selectedHotelId)
    : null;
  const primaryHotel =
    currentUser?.hotelId && typeof currentUser.hotelId === "object"
      ? currentUser.hotelId
      : findHotelById(hotels, primaryHotelId);
  const accessHotels = Array.isArray(currentUser?.hotelAccess)
    ? currentUser.hotelAccess
        .map((hotel) => (typeof hotel === "object" ? hotel : findHotelById(hotels, hotel)))
        .filter(Boolean)
    : [];

  if (selectedHotelId && selectedHotelId !== "all") {
    return {
      detail: getHotelMeta(selectedHotel, currentScope),
      eyebrow,
      label: formatHotelName(selectedHotel) || hotelFallback,
    };
  }

  if (groupRoles.includes(currentUser?.role) && (hotels.length > 1 || accessHotels.length > 1)) {
    return {
      detail: translateOr(t, "common.groupDashboard", "Group dashboard"),
      eyebrow,
      label: translateOr(t, "common.allHotels", "All hotels"),
    };
  }

  if (primaryHotel) {
    return {
      detail: getHotelMeta(primaryHotel, currentScope),
      eyebrow,
      label: formatHotelName(primaryHotel),
    };
  }

  if (accessHotels.length === 1) {
    return {
      detail: getHotelMeta(accessHotels[0], currentScope),
      eyebrow,
      label: formatHotelName(accessHotels[0]),
    };
  }

  return {
    detail: currentScope,
    eyebrow,
    label: hotelFallback,
  };
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
  const [language, setLanguage] = useState(getInitialLanguage);
  const [activePage, setActivePage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
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
  const [pendingAdminClose, setPendingAdminClose] = useState(null);
  const [adminCloseReason, setAdminCloseReason] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const selectedTicketRef = useRef(null);
  const passwordChangeToastShownRef = useRef(false);
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
  const ticketListParams = useMemo(() => {
    const params = { ...scopedParams };
    if (currentUser?.role === "GroupAdmin") {
      params.limit = 200;
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterPriority !== "all") params.priority = filterPriority;
    }
    return params;
  }, [currentUser?.role, filterPriority, filterStatus, scopedParams]);
  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.data?.code === "PASSWORD_CHANGE_REQUIRED") {
          const storedUser = getStoredUser();
          const forcedUser = {
            ...(storedUser || {}),
            ...(currentUser || {}),
            mustChangePassword: true,
          };

          localStorage.setItem("user", JSON.stringify(forcedUser));
          setCurrentUser(forcedUser);
          setActivePage("profile");
          setProfileInitialSection("password");
          setLoading(false);

          if (!passwordChangeToastShownRef.current) {
            toast.error(t("common.passwordChangeRequired"));
            passwordChangeToastShownRef.current = true;
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [currentUser, t]);

  const fetchTickets = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!token) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      const res = await axios.get(API_URL, {
        headers: authHeaders,
        params: ticketListParams,
      });
      setTickets(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
      toast.error(getErrorMessage(error, "Failed to fetch tickets"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [authHeaders, ticketListParams, token]);

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
    if (!token || !roleCanManageTickets(currentUser?.role)) {
      setUsers([]);
      return;
    }

    try {
      const res = await axios.get(`${AUTH_URL}/users`, {
        headers: authHeaders,
        params: scopedParams,
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  }, [authHeaders, currentUser?.role, scopedParams, token]);

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
      passwordChangeToastShownRef.current = false;
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setActivePage(res.data.user?.mustChangePassword ? "profile" : "dashboard");
      setTickets([]);
      setSummaryTickets([]);
      setHotels([]);
      setDepartments([]);
      toast.success(
        res.data.user?.mustChangePassword
          ? t("common.passwordChangeRequired")
          : t("common.loginSuccessful"),
      );
      return true;
    } catch (error) {
      console.error("Login failed", error);
      toast.error(getErrorMessage(error, "Login failed"));
      return false;
    }
  };

  const handleLogout = () => {
    passwordChangeToastShownRef.current = false;
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
    setFilterPriority("all");
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
    const currentUserId = currentUser?._id || currentUser?.id || "";
    const requesterName =
      currentUser?.role === "User"
        ? currentUser?.name || ""
        : form.requester.trim() || currentUser?.name || "";
    const requesterUserId =
      currentUser?.role === "User" ? currentUserId : form.requesterUserId || "";
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
          assignedTo: canAssignTickets ? form.assignedTo || undefined : undefined,
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

  const performUpdateStatus = async (id, status, options = {}) => {
    try {
      setUpdatingTicketId(id);
      const payload = { status };
      if (options.adminCloseReason) {
        payload.adminCloseReason = options.adminCloseReason;
      }

      await axios.patch(
        `${API_URL}/${id}/status`,
        payload,
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success(
        status === "closed" && canManageTickets
          ? t("common.ticketClosedWithoutRequesterRating")
          : t("common.statusUpdated"),
      );
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

  const updateStatus = async (id, status) => {
    if (!canManageTickets && currentUser?.role !== "Agent") {
      toast.error("Only assigned agents, managers, or admins can update ticket status");
      return;
    }

    if (status === "closed" && canManageTickets) {
      const ticket = [selectedTicket, ...tickets, ...summaryTickets].filter(Boolean).find(
        (item) => String(item._id || item.id) === String(id),
      );
      setAdminCloseReason("");
      setPendingAdminClose({
        id,
        title: ticket?.title || ticket?.ticketNumber || id,
      });
      return;
    }

    await performUpdateStatus(id, status);
  };

  const confirmAdminCloseTicket = async () => {
    const ticket = pendingAdminClose;
    if (!ticket?.id) return;

    const reason = adminCloseReason.trim();
    if (!reason) {
      toast.error(t("common.adminCloseReasonRequired"));
      return;
    }

    setPendingAdminClose(null);
    setAdminCloseReason("");
    await performUpdateStatus(ticket.id, "closed", { adminCloseReason: reason });
  };

  const reopenTicket = async (id) => {
    if (!id) return;

    try {
      setUpdatingTicketId(id);
      await axios.patch(
        `${API_URL}/${id}/reopen`,
        {},
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success("Ticket reopened");
      await fetchTickets();
      await fetchSummaryTickets();
      if (selectedTicket && selectedTicket._id === id) {
        await openTicketDetails(id);
      }
    } catch (error) {
      console.error("Failed to reopen ticket", error);
      toast.error(getErrorMessage(error, "Failed to reopen ticket"));
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const updateTicketPriority = async (id, priority) => {
    if (!canManageTickets) {
      toast.error("Only Admin or Manager can update priority");
      return;
    }

    try {
      setUpdatingTicketId(id);
      await axios.patch(
        `${API_URL}/${id}`,
        { priority, criticalRequested: false },
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success("Priority updated");
      await fetchTickets();
      await fetchSummaryTickets();
      if (selectedTicket && selectedTicket._id === id) {
        await openTicketDetails(id);
      }
    } catch (error) {
      console.error("Failed to update priority", error);
      toast.error(getErrorMessage(error, "Failed to update priority"));
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const updateTicketDueDate = async (id, dueDate) => {
    if (!canManageTickets) {
      toast.error("Only Admin or Manager can update due date");
      return;
    }
    if (!dueDate) return;

    try {
      setUpdatingTicketId(id);
      await axios.patch(
        `${API_URL}/${id}`,
        { dueDate: new Date(dueDate).toISOString() },
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success("Due date updated");
      await fetchTickets();
      await fetchSummaryTickets();
      if (selectedTicket && selectedTicket._id === id) {
        await openTicketDetails(id);
      }
    } catch (error) {
      console.error("Failed to update due date", error);
      toast.error(getErrorMessage(error, "Failed to update due date"));
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const assignTicket = async (id, assignedTo) => {
    if (!assignedTo) return;
    if (!canAssignTickets) return;

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

  const claimTicket = async (id) => {
    if (!id || currentUser?.role !== "Agent") return false;

    try {
      setAssigningTicketId(id);
      await axios.patch(
        `${API_URL}/${id}/claim`,
        {},
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success(t("agentQueue.quick.claimSuccess"));
      await fetchTickets();
      await fetchSummaryTickets();
      if (selectedTicket && (selectedTicket._id || selectedTicket.id) === id) {
        await openTicketDetails(id);
      }
      return true;
    } catch (error) {
      console.error("Failed to claim ticket", error);
      toast.error(getErrorMessage(error, t("agentQueue.quick.claimFailed")));
      return false;
    } finally {
      setAssigningTicketId(null);
    }
  };

  const openTicketDetails = useCallback(async (id) => {
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
  }, [authHeaders, scopedParams]);

  const closeTicketDetails = () => {
    setSelectedTicket(null);
  };

  const openNotificationTicket = async (ticketId) => {
    setActivePage("tickets");
    await openTicketDetails(ticketId);
  };

  const syncTicketsFromRealtime = async (notification) => {
    const ticketId = notification?.ticketId?._id || notification?.ticketId;
    const isTicketEvent = !notification || ticketId || String(notification?.type || "").startsWith("ticket_");
    if (!isTicketEvent) return;

    await Promise.all([
      fetchTickets({ silent: true }),
      fetchSummaryTickets(),
    ]);

    const activeTicket = selectedTicketRef.current;
    if (ticketId && activeTicket && String(activeTicket._id) === String(ticketId)) {
      await openTicketDetails(ticketId);
    }
  };

  const addTicketComment = async (ticketId, text, options = {}) => {
    const { openDetails = true } = options;

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
      if (openDetails) {
        await openTicketDetails(ticketId);
      }
      return true;
    } catch (error) {
      console.error("Failed to add comment", error);
      toast.error(getErrorMessage(error, "Failed to add comment"));
      return false;
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
      toast.success(t("detail.confirmResolutionSuccess"));
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
      passwordChangeToastShownRef.current = false;
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

  const canManageTickets = roleCanManageTickets(currentUser?.role);
  const canAssignTickets = roleCanAssignTickets(currentUser?.role);
  const canManageDepartments = roleCanManageDepartments(currentUser?.role);
  const canManageUsers = roleCanManageUsers(currentUser?.role);
  const canManageHotelSettings = roleCanManageHotelSettings(currentUser?.role);
  const accessibleHotelIds = [...new Set(getUserHotelAccessIds(currentUser))];
  const canSelectHotel =
    hotels.length > 1 &&
    (groupRoles.includes(currentUser?.role) || accessibleHotelIds.length > 1);
  const shouldShowDashboardHotelChip = dashboardHotelChipRoles.has(currentUser?.role);
  const activeHotelContext = useMemo(
    () => getActiveHotelContext({ currentUser, hotels, language, selectedHotelId, t }),
    [currentUser, hotels, language, selectedHotelId, t],
  );
  const canUploadSelectedTicketAttachment =
    attachmentsEnabled &&
    (canManageTickets ||
      (currentUser?.role === "Agent" &&
        getEntityId(selectedTicket?.assignedTo) === getEntityId(currentUser)));

  const visibleActivePage = useMemo(() => {
    if (
      currentUser?.role === "User" &&
      (activePage === "monthly-report" || activePage === "quarterly-report")
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
  const pendingDeleteUser = users.find(
    (user) => user._id === deleteUserId || user.id === deleteUserId,
  );
  const { filteredTickets, ticketsPerPage } = useTicketFilters({
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
    if (currentUser?.mustChangePassword) {
      return undefined;
    }

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
        canManageTickets
          ? axios
              .get(`${AUTH_URL}/users`, { headers: authHeaders, params: scopedParams })
              .then((res) => res.data)
              .catch((error) => {
                console.error("Failed to fetch users", error);
                return null;
              })
          : Promise.resolve([]),
        getHotels(token).catch((error) => {
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
  }, [authHeaders, canManageTickets, currentUser, scopedParams, ticketListParams, token]);

  useEffect(() => {
    if (!selectedHotelId) return;
    localStorage.setItem("selectedHotelId", selectedHotelId);
  }, [selectedHotelId]);

  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  useEffect(() => {
    persistLanguage(language);
  }, [language]);

  if (!token) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  if (currentUser?.mustChangePassword) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <Toaster position="top-right" />
        <div className="min-h-dvh bg-slate-100 p-6 dark:bg-slate-950">
          <div className="mx-auto max-w-3xl">
            <Suspense fallback={<PageLoading />}>
              <ProfilePage
                changingPassword={changingPassword}
                currentUser={currentUser}
                forcePasswordChange
                initialSection="password"
                onChangePassword={changeMyPassword}
                onUpdateProfile={updateMyProfile}
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
      <ConfirmModal
        confirmLabel={t("common.closeTicket")}
        confirmDisabled={!adminCloseReason.trim()}
        open={!!pendingAdminClose}
        title={t("common.closeTicketAsAdmin")}
        message={t("common.adminCloseMessage", {
          title: pendingAdminClose?.title || t("common.closeTicket"),
        })}
        onCancel={() => {
          setPendingAdminClose(null);
          setAdminCloseReason("");
        }}
        onConfirm={confirmAdminCloseTicket}
      >
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200" htmlFor="admin-close-reason">
          {t("common.adminCloseReason")}
        </label>
        <textarea
          id="admin-close-reason"
          className="ops-input mt-2 min-h-28 resize-y"
          maxLength={500}
          onChange={(event) => setAdminCloseReason(event.target.value)}
          placeholder={t("common.adminCloseReasonPlaceholder")}
          value={adminCloseReason}
        />
        <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {adminCloseReason.trim().length}/500
        </p>
      </ConfirmModal>
      <TicketDetailModal
        open={!!selectedTicket}
        ticket={selectedTicket}
        currentUser={currentUser}
        onClose={closeTicketDetails}
        onComment={addTicketComment}
        onSatisfaction={submitTicketSatisfaction}
        onUploadAttachment={uploadTicketAttachment}
        canUploadAttachment={canUploadSelectedTicketAttachment}
        canManageTickets={canManageTickets}
        onUpdatePriority={updateTicketPriority}
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
            <header className="ops-topbar">
              <div className="min-w-0">
                <h2 className="break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  {currentPageMeta.title}
                </h2>
                <p className="mt-1 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {currentPageMeta.subtitle}
                </p>
                {visibleActivePage === "dashboard" && shouldShowDashboardHotelChip && activeHotelContext.label && (
                  <div className="ops-context-chip">
                    <span className="ops-soft-icon h-9 w-9">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="ops-section-label block">
                        {activeHotelContext.eyebrow}
                      </span>
                      <span className="block truncate text-sm font-black text-slate-900 dark:text-white">
                        {activeHotelContext.label}
                      </span>
                    </span>
                    {activeHotelContext.detail && (
                      <span className="hidden max-w-[12rem] truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-950 dark:text-teal-50 sm:block">
                        {activeHotelContext.detail}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <div className="self-start sm:self-auto">
                  <NotificationBell
                    token={token}
                    onOpenTicket={openNotificationTicket}
                    onRealtimeNotification={syncTicketsFromRealtime}
                    onRealtimeSync={syncTicketsFromRealtime}
                    t={t}
                  />
                </div>
                {canSelectHotel && (
                  <ThemedSelect
                    className="w-full min-w-0 sm:w-72"
                    value={selectedHotelId}
                    onChange={handleSelectedHotelChange}
                    variant="pill"
                    options={[
                      { value: "all", label: t("common.allHotels"), meta: t("common.groupDashboard"), prefix: "ALL" },
                      ...hotels.map((hotel) => ({
                        value: hotel._id || hotel.id,
                        label: `${hotel.code} / ${hotel.name}`,
                        meta: hotel.region || "Hotel",
                        prefix: String(hotel.code || hotel.name || "HT").slice(0, 2),
                      })),
                    ]}
                  />
                )}
                <Button
                  onClick={() => setLanguage((current) => (current === "th" ? "en" : "th"))}
                  className="rounded-full px-4 py-2 text-sm font-black"
                  aria-label={t("common.languageToggle")}
                  title={t("common.languageToggle")}
                  variant="secondary"
                >
                  {language === "th" ? "TH" : "EN"}
                </Button>
                <Button
                  onClick={() => setDarkMode(!darkMode)}
                  className="rounded-full px-5 py-2 text-sm font-black"
                  variant="secondary"
                >
                  {darkMode ? t("common.lightMode") : t("common.darkMode")}
                </Button>
              </div>
            </header>

            <Suspense fallback={<PageLoading />}>
              {visibleActivePage === "dashboard" && (
                <DashboardPage
                  darkMode={darkMode}
                  currentUser={currentUser}
                  hotels={hotels}
                  loading={loading}
                  onNavigate={setActivePage}
                  claimTicket={claimTicket}
                  assigningTicketId={assigningTicketId}
                  selectedHotelId={selectedHotelId}
                  t={t}
                  tickets={summaryTickets}
                />
              )}

              {visibleActivePage === "tickets" && (
                <TicketsPage
                  assigningTicketId={assigningTicketId}
                  assignTicket={assignTicket}
                  claimTicket={claimTicket}
                  filterPriority={filterPriority}
                  hotels={hotels}
                  tickets={filteredTickets}
                  ticketsPerPage={ticketsPerPage}
                  loading={loading}
                  search={search}
                  setSearch={handleSearchChange}
                  filterStatus={filterStatus}
                  setFilterStatus={handleFilterStatusChange}
                  setFilterPriority={handleFilterPriorityChange}
                  selectedHotelId={selectedHotelId}
                  setSelectedHotelId={handleSelectedHotelChange}
                  updatingTicketId={updatingTicketId}
                  deletingTicketId={deletingTicketId}
                  updateStatus={updateStatus}
                  reopenTicket={reopenTicket}
                  updatePriority={updateTicketPriority}
                  updateDueDate={updateTicketDueDate}
                  addTicketComment={addTicketComment}
                  deleteTicket={deleteTicket}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  onViewTicket={openTicketDetails}
                  currentUser={currentUser}
                  users={users}
                  t={t}
                />
              )}

              {visibleActivePage === "add-ticket" && (
                <AddTicketPage
                  canAssignTickets={canAssignTickets}
                  form={form}
                  setForm={setForm}
                  handleSubmit={handleSubmit}
                  submitting={submitting}
                  users={users}
                  token={token}
                  hotelId={selectedHotelId}
                  currentUser={currentUser}
                  departments={departments}
                  t={t}
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
                  t={t}
                  token={token}
                />
              )}

              {visibleActivePage === "audit-logs" && canManageHotelSettings && (
                <AuditLogsPage
                  hotels={hotels}
                  selectedHotelId={selectedHotelId}
                  token={token}
                />
              )}

              {visibleActivePage === "departments" && canManageDepartments && (
                <DepartmentManagementPage
                  departments={departments}
                  hotels={hotels}
                  onDepartmentsChange={fetchDepartments}
                  selectedHotelId={selectedHotelId}
                  t={t}
                  token={token}
                />
              )}

              {visibleActivePage === "hotels" && ["GroupAdmin", "Admin"].includes(currentUser?.role) && (
                <HotelManagementPage
                  hotels={hotels}
                  onHotelsChange={fetchHotels}
                  t={t}
                  token={token}
                />
              )}

              {visibleActivePage === "user-management" && canManageUsers && (
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
      <div className="ops-surface px-6 py-4 text-sm font-semibold text-slate-700 dark:text-teal-50">
        {createTranslator(getInitialLanguage())("common.loadingPage")}
      </div>
    </div>
  );
}

export default App;
