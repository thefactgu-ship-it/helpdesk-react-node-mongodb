import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import StatCard from "./components/StatCard";
import TicketTable from "./components/TicketTable";
import AddTicketForm from "./components/AddTicketForm";
import Sidebar from "./components/Sidebar";
import toast, { Toaster } from "react-hot-toast";
import ConfirmModal from "./components/ConfirmModal";
import TicketCharts from "./components/TicketCharts";
import LoginPage from "./components/LoginPage";

const API_URL = "http://localhost:5000/api/tickets";
const AUTH_URL = "http://localhost:5000/api/auth";

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 5;
  const [tickets, setTickets] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);
  const [deletingTicketId, setDeletingTicketId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  const fetchTickets = useCallback(async () => {
    if (!token) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTickets(res.data);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
      toast.error(getErrorMessage(error, "Failed to fetch tickets"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = async (loginForm) => {
    try {
      const res = await axios.post(`${AUTH_URL}/login`, loginForm);

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setTickets([]);

      toast.success("Login successful");
      return true;
    } catch (error) {
      console.error("Login failed", error);
      toast.error(getErrorMessage(error, "Login failed"));
      return false;
    }
  };

  const handleRegister = async (registerForm) => {
    try {
      await axios.post(`${AUTH_URL}/register`, registerForm);
      toast.success("Account created. Please log in.");
      return true;
    } catch (error) {
      console.error("Register failed", error);
      toast.error(getErrorMessage(error, "Register failed"));
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setTickets([]);
    setSearch("");
    setFilterStatus("all");
    setCurrentPage(1);
    toast.success("Logged out");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Ticket title is required");
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
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success("Ticket added successfully");
      setForm({
        title: "",
        description: "",
        priority: "medium",
      });

      await fetchTickets();
    } catch (error) {
      console.error("Failed to create ticket", error);
      toast.error(getErrorMessage(error, "Failed to create ticket"));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setUpdatingTicketId(id);

      await axios.patch(
        `${API_URL}/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success("Status updated");
      await fetchTickets();
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error(getErrorMessage(error, "Failed to update status"));
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const confirmDeleteTicket = async () => {
    try {
      setDeletingTicketId(deleteId);

      await axios.delete(`${API_URL}/${deleteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Ticket deleted");
      setDeleteId(null);
      await fetchTickets();
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

  useEffect(() => {
    if (!token) return;

    // Sync tickets whenever authentication becomes available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets();
  }, [fetchTickets, token]);

  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "open").length;
  const progress = tickets.filter((t) => t.status === "in_progress").length;
  const closed = tickets.filter((t) => t.status === "closed").length;
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || ticket.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ticketsPerPage,
    currentPage * ticketsPerPage,
  );
  useEffect(() => {
    // Reset pagination when table filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [search, filterStatus]);

  if (!token) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
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
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-400 via-purple-500 to-violet-700 p-6 text-slate-900 dark:text-white">
        <div className="mx-auto flex max-w-7xl overflow-hidden rounded-3xl bg-white/90 shadow-2xl backdrop-blur dark:bg-slate-900/90">
          <Sidebar />
          <main className="flex-1 bg-slate-50/80 p-6 dark:bg-slate-900">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  React + Node.js + MongoDB ticket overview
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-300 transition hover:bg-purple-700 dark:bg-white dark:text-purple-700 dark:shadow-none"
                >
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </button>

                <button
                  onClick={handleLogout}
                  className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </header>

            <section className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-4">
              <StatCard
                title="Total Tickets"
                value={total}
                gradient="from-orange-400 to-pink-500"
              />
              <StatCard
                title="Open"
                value={open}
                gradient="from-blue-400 to-cyan-500"
              />
              <StatCard
                title="In Progress"
                value={progress}
                gradient="from-purple-500 to-indigo-500"
              />
              <StatCard
                title="Closed"
                value={closed}
                gradient="from-emerald-400 to-teal-500"
              />
            </section>

            <TicketCharts open={open} progress={progress} closed={closed} />

            <AddTicketForm
              form={form}
              setForm={setForm}
              handleSubmit={handleSubmit}
              submitting={submitting}
            />

            <TicketTable
              tickets={paginatedTickets}
              loading={loading}
              search={search}
              setSearch={setSearch}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              updatingTicketId={updatingTicketId}
              deletingTicketId={deletingTicketId}
              updateStatus={updateStatus}
              deleteTicket={deleteTicket}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
