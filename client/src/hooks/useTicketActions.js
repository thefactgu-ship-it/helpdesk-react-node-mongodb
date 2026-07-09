import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../services/api";
import { getEntityId, getErrorMessage } from "../utils/entityHelpers";

const API_URL = `${API_BASE_URL}/tickets`;
const attachmentsEnabled = import.meta.env.VITE_ATTACHMENTS_ENABLED === "true";

/**
 * Default form values for the Add Ticket form.
 */
export const INITIAL_FORM_STATE = Object.freeze({
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
  status: "",
});

/**
 * Custom hook encapsulating all ticket-related state and operations.
 *
 * Manages: tickets list, summary, selected ticket, form state, CRUD
 * operations, status/priority/due-date updates, assign/claim, reopen,
 * comments, satisfaction, attachments, and delete flows.
 */
export function useTicketActions({
  authHeaders,
  canAssignTickets,
  canManageTickets,
  currentUser,
  departments,
  onOpenTicketPage,
  scopedParams,
  setLoading,
  t,
  ticketListParams,
  token,
}) {
  const [tickets, setTickets] = useState([]);
  const [summaryTickets, setSummaryTickets] = useState([]);
  const [form, setForm] = useState({ ...INITIAL_FORM_STATE });
  const [submitting, setSubmitting] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [deletingTicketId, setDeletingTicketId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [pendingAdminClose, setPendingAdminClose] = useState(null);
  const [adminCloseReason, setAdminCloseReason] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const selectedTicketRef = useRef(null);

  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  const canUploadSelectedTicketAttachment =
    attachmentsEnabled &&
    (canManageTickets ||
      (currentUser?.role === "Agent" &&
        getEntityId(selectedTicket?.assignedTo) === getEntityId(currentUser)));

  const fetchTickets = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!token) {
      setTickets([]);
      setLoading?.(false);
      return;
    }

    try {
      if (!silent) setLoading?.(true);
      const res = await axios.get(API_URL, {
        headers: authHeaders,
        params: ticketListParams,
      });
      setTickets(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
      toast.error(getErrorMessage(error, "Failed to fetch tickets"));
    } finally {
      if (!silent) setLoading?.(false);
    }
  }, [authHeaders, setLoading, ticketListParams, token]);

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

  const closeTicketDetails = useCallback(() => {
    setSelectedTicket(null);
  }, []);

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
      const selectedHotelId = scopedParams.hotelId;
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
          hotelId: selectedHotelId || undefined,
          status: form.status || undefined,
        },
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success("Ticket added successfully");
      setForm({ ...INITIAL_FORM_STATE });
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
      return true;
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error(getErrorMessage(error, "Failed to update status"));
      return false;
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

    const didClose = await performUpdateStatus(ticket.id, "closed", { adminCloseReason: reason });
    if (didClose) {
      setPendingAdminClose(null);
      setAdminCloseReason("");
    }
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

  const openNotificationTicket = async (ticketId) => {
    onOpenTicketPage?.();
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

  const resetTickets = useCallback(() => {
    setTickets([]);
    setSummaryTickets([]);
  }, []);

  return {
    addTicketComment,
    adminCloseReason,
    assigningTicketId,
    assignTicket,
    canUploadSelectedTicketAttachment,
    claimTicket,
    closeTicketDetails,
    confirmAdminCloseTicket,
    confirmDeleteTicket,
    deleteId,
    deleteTicket,
    deletingTicketId,
    fetchSummaryTickets,
    fetchTickets,
    form,
    handleSubmit,
    openNotificationTicket,
    openTicketDetails,
    pendingAdminClose,
    reopenTicket,
    resetTickets,
    selectedTicket,
    setAdminCloseReason,
    setDeleteId,
    setForm,
    setPendingAdminClose,
    setSummaryTickets,
    setTickets,
    submitting,
    submitTicketSatisfaction,
    summaryTickets,
    syncTicketsFromRealtime,
    tickets,
    updateStatus,
    updateTicketDueDate,
    updateTicketPriority,
    updatingTicketId,
    uploadTicketAttachment,
  };
}
