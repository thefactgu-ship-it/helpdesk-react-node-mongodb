import { useEffect, useMemo, useState } from "react";
import Badge from "./Badge";
import SkeletonRow from "./SkeletonRow";
import ThemedSelect from "./ThemedSelect";

function TicketTable({
  assigningTicketId,
  assignTicket,
  tickets,
  loading,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  updatingTicketId,
  deletingTicketId,
  updatePriority,
  updateStatus,
  deleteTicket,
  currentPage,
  setCurrentPage,
  ticketsPerPage = 5,
  onViewTicket,
  currentUser,
  users = [],
}) {
  const [activeQueue, setActiveQueue] = useState("now");
  const canManageTickets = ["GroupAdmin", "Admin", "RegionalManager", "HotelAdmin", "Manager"].includes(currentUser?.role);
  const assignableUsers = users.filter((user) =>
    ["admin", "manager", "agent", "staff"].includes(
      String(user.role || "").toLowerCase(),
    ),
  );
  const currentUserId = getEntityId(currentUser);
  const queueOptions = useMemo(
    () => buildQueueOptions(tickets, currentUserId),
    [currentUserId, tickets],
  );
  const queueTickets = useMemo(
    () => tickets.filter((ticket) => matchesQueue(ticket, activeQueue, currentUserId)),
    [activeQueue, currentUserId, tickets],
  );
  const totalPages = Math.max(1, Math.ceil(queueTickets.length / ticketsPerPage));
  const visibleTickets = queueTickets.slice(
    (currentPage - 1) * ticketsPerPage,
    currentPage * ticketsPerPage,
  );
  const canUpdateTicketStatus = (ticket) =>
    canManageTickets ||
    (currentUser?.role === "Agent" && getEntityId(ticket.assignedTo) === currentUserId);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, setCurrentPage, totalPages]);

  const handleQueueChange = (queueId) => {
    setActiveQueue(queueId);
    setCurrentPage(1);
  };

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900 dark:text-white">
            คิวงาน / Work Queue
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            ดูงานที่ต้องจัดการก่อน แล้วค่อยไล่รายการทั้งหมด
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="ค้นหา ticket / Search..."
            value={search}
            disabled={loading}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 md:w-80"
          />

          <ThemedSelect
            className="w-full md:w-56"
            size="sm"
            value={filterStatus}
            disabled={loading}
            onChange={setFilterStatus}
            options={statusOptions}
          />
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {queueOptions.map((queue) => {
          const active = activeQueue === queue.id;
          return (
            <button
              key={queue.id}
              type="button"
              onClick={() => handleQueueChange(queue.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                active
                  ? `${queue.activeClass} shadow-sm`
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <span>{queue.label}</span>
              <span className={`rounded-full px-2 py-0.5 ${active ? "bg-white/25" : "bg-slate-100 dark:bg-slate-800"}`}>
                {queue.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          <>
            <MobileTicketSkeleton />
            <MobileTicketSkeleton />
            <MobileTicketSkeleton />
          </>
        ) : (
          visibleTickets.map((ticket) => {
            const isUpdating = updatingTicketId === ticket._id;
            const isAssigning = assigningTicketId === ticket._id;
            const isDeleting = deletingTicketId === ticket._id;
            const isBusy = isUpdating || isAssigning || isDeleting;

            return (
              <TicketMobileCard
                key={ticket._id}
                assignTicket={assignTicket}
                assignableUsers={assignableUsers}
                canManageTickets={canManageTickets}
                canUpdateStatus={canUpdateTicketStatus(ticket)}
                deleteTicket={deleteTicket}
                isAssigning={isAssigning}
                isBusy={isBusy}
                isDeleting={isDeleting}
                onViewTicket={onViewTicket}
                ticket={ticket}
                updateStatus={updateStatus}
                updatePriority={updatePriority}
              />
            );
          })
        )}

        {!loading && queueTickets.length === 0 && (
          <QueueEmptyState activeQueue={activeQueue} />
        )}

        <PaginationControls
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-3 font-semibold">Ticket #</th>
              <th className="font-semibold">งาน / Issue</th>
              <th className="font-semibold">Priority</th>
              <th className="font-semibold">Status</th>
              <th className="font-semibold">Assign</th>
              <th className="font-semibold">Due</th>
              <th className="font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              visibleTickets.map((ticket) => {
                const isUpdating = updatingTicketId === ticket._id;
                const isAssigning = assigningTicketId === ticket._id;
                const isDeleting = deletingTicketId === ticket._id;
                const isBusy = isUpdating || isAssigning || isDeleting;

                return (
                  <tr
                    key={ticket._id}
                    className="border-b last:border-0 dark:border-slate-700"
                  >
                    <td className="py-4 font-semibold text-blue-700">
                      {ticket.ticketNumber}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{ticket.title}</span>
                        {getQueueBadges(ticket).map((badge) => (
                          <StatusPill key={badge.label} {...badge} />
                        ))}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {ticket.category} / {ticket.departmentName || ticket.department}
                        {ticket.requester ? ` / ${ticket.requester}` : ""}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {canManageTickets ? (
                          <ThemedSelect
                            className="w-32"
                            compactOptions
                            menuWidth={150}
                            size="sm"
                            value={ticket.priority}
                            disabled={isBusy}
                            onChange={(value) => updatePriority(ticket._id, value)}
                            options={priorityOptions}
                          />
                        ) : (
                          <Badge text={ticket.priority} />
                        )}
                        {ticket.criticalRequested && (
                          <StatusPill label="Critical review" tone="warning" />
                        )}
                      </div>
                    </td>
                    <td>
                      {canUpdateTicketStatus(ticket) ? (
                        <ThemedSelect
                          className="w-36"
                          compactOptions
                          menuWidth={160}
                          size="sm"
                          value={ticket.status}
                          disabled={isBusy}
                          onChange={(value) => updateStatus(ticket._id, value)}
                          options={statusOptions.filter((option) => option.value !== "all")}
                        />
                      ) : (
                        <Badge text={ticket.status} />
                      )}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">
                      {canManageTickets ? (
                        <ThemedSelect
                          className="w-40"
                          compactOptions
                          menuWidth={180}
                          size="sm"
                          value={ticket.assignedTo?._id || ""}
                          disabled={isBusy || !assignableUsers.length}
                          emptyLabel={isAssigning ? "กำลังมอบหมาย..." : "ยังไม่มอบหมาย"}
                          onChange={(value) => assignTicket(ticket._id, value)}
                          options={[
                            { value: "", label: isAssigning ? "กำลังมอบหมาย..." : "ยังไม่มอบหมาย", prefix: "-" },
                            ...assignableUsers.map((user) => ({
                              value: user._id || user.id,
                              label: user.name,
                              meta: user.role,
                              prefix: getInitials(user.name),
                            })),
                          ]}
                        />
                      ) : (
                        ticket.assignedTo?.name || "ยังไม่มอบหมาย"
                      )}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400">
                      <DueLabel ticket={ticket} />
                    </td>
                    <td className="space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewTicket(ticket._id)}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        ดู / View
                      </button>
                      {canManageTickets && (
                        <button
                          type="button"
                          onClick={() => deleteTicket(ticket._id)}
                          disabled={isBusy}
                          className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}

            {!loading && queueTickets.length === 0 && (
              <tr>
                <td colSpan="7" className="py-8">
                  <QueueEmptyState activeQueue={activeQueue} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationControls
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>
    </section>
  );
}

function TicketMobileCard({
  assignTicket,
  assignableUsers,
  canManageTickets,
  canUpdateStatus,
  deleteTicket,
  isAssigning,
  isBusy,
  isDeleting,
  onViewTicket,
  ticket,
  updateStatus,
  updatePriority,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-300">
            {ticket.ticketNumber}
          </p>
          <h4 className="mt-1 break-words text-base font-black text-slate-950 dark:text-white">
            {ticket.title}
          </h4>
          <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
            {ticket.category} / {ticket.departmentName || ticket.department}
            {ticket.requester ? ` / ${ticket.requester}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {canManageTickets ? (
            <ThemedSelect
              compactOptions
              size="sm"
              value={ticket.priority}
              disabled={isBusy}
              onChange={(value) => updatePriority(ticket._id, value)}
              options={priorityOptions}
            />
          ) : (
            <Badge text={ticket.priority} />
          )}
          {ticket.criticalRequested && (
            <StatusPill label="Critical review" tone="warning" />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {getQueueBadges(ticket).map((badge) => (
          <StatusPill key={badge.label} {...badge} />
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MobileMeta label="Due" value={<DueLabel ticket={ticket} />} />
        <MobileMeta label="Assign" value={ticket.assignedTo?.name || "ยังไม่มอบหมาย"} />
      </dl>

      <div className="mt-4 grid gap-3">
        {canUpdateStatus ? (
          <ThemedSelect
            compactOptions
            size="sm"
            value={ticket.status}
            disabled={isBusy}
            onChange={(value) => updateStatus(ticket._id, value)}
            options={statusOptions.filter((option) => option.value !== "all")}
          />
        ) : (
          <Badge text={ticket.status} />
        )}

        {canManageTickets && (
          <ThemedSelect
            compactOptions
            size="sm"
            value={ticket.assignedTo?._id || ""}
            disabled={isBusy || !assignableUsers.length}
            emptyLabel={isAssigning ? "กำลังมอบหมาย..." : "ยังไม่มอบหมาย"}
            onChange={(value) => assignTicket(ticket._id, value)}
            options={[
              { value: "", label: isAssigning ? "กำลังมอบหมาย..." : "ยังไม่มอบหมาย", prefix: "-" },
              ...assignableUsers.map((user) => ({
                value: user._id || user.id,
                label: user.name,
                meta: user.role,
                prefix: getInitials(user.name),
              })),
            ]}
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onViewTicket(ticket._id)}
          className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          ดู / View
        </button>
        {canManageTickets && (
          <button
            type="button"
            onClick={() => deleteTicket(ticket._id)}
            disabled={isBusy}
            className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </article>
  );
}

function MobileMeta({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3 dark:bg-slate-950">
      <dt className="text-[11px] font-bold text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function QueueEmptyState({ activeQueue }) {
  const message = emptyQueueMessages[activeQueue] || emptyQueueMessages.all;

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className="font-bold text-slate-800 dark:text-slate-100">{message.title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        {message.description}
      </p>
    </div>
  );
}

function MobileTicketSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-3 h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-2 h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-16 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-16 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function PaginationControls({ currentPage, setCurrentPage, totalPages }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
      >
        ก่อนหน้า
      </button>

      <span className="text-sm text-slate-500 dark:text-slate-400">
        หน้า {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
      >
        ถัดไป
      </button>
    </div>
  );
}

function DueLabel({ ticket }) {
  if (!ticket.dueDate) return "-";

  const dueDate = new Date(ticket.dueDate);
  const formatted = dueDate.toLocaleDateString();

  if (isOverdue(ticket)) {
    return <span className="font-bold text-rose-600 dark:text-rose-300">{formatted}</span>;
  }
  if (isDueSoon(ticket)) {
    return <span className="font-bold text-amber-600 dark:text-amber-300">{formatted}</span>;
  }
  return formatted;
}

function StatusPill({ label, tone = "info" }) {
  const className = {
    danger: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/20",
    warning: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20",
    info: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/20",
    neutral: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  }[tone];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${className}`}>
      {label}
    </span>
  );
}

function buildQueueOptions(tickets, currentUserId) {
  const count = (queueId) =>
    tickets.filter((ticket) => matchesQueue(ticket, queueId, currentUserId)).length;

  return [
    { id: "now", label: "ต้องทำตอนนี้", count: count("now"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    { id: "overdue", label: "Overdue", count: count("overdue"), activeClass: "border-rose-600 bg-rose-600 text-white" },
    { id: "dueSoon", label: "Due soon", count: count("dueSoon"), activeClass: "border-amber-500 bg-amber-500 text-white" },
    { id: "unassigned", label: "Unassigned", count: count("unassigned"), activeClass: "border-sky-600 bg-sky-600 text-white" },
    { id: "assignedToMe", label: "Assigned to me", count: count("assignedToMe"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    { id: "waitingRequester", label: "Waiting requester", count: count("waitingRequester"), activeClass: "border-slate-700 bg-slate-700 text-white" },
    { id: "all", label: "All", count: count("all"), activeClass: "border-blue-600 bg-blue-600 text-white" },
  ];
}

function matchesQueue(ticket, queueId, currentUserId) {
  if (queueId === "all") return true;
  if (queueId === "overdue") return isOverdue(ticket);
  if (queueId === "dueSoon") return isDueSoon(ticket);
  if (queueId === "unassigned") return !isCompleted(ticket) && !ticket.assignedTo;
  if (queueId === "assignedToMe") {
    return !isCompleted(ticket) && getEntityId(ticket.assignedTo) === currentUserId;
  }
  if (queueId === "waitingRequester") return isWaitingRequester(ticket);
  return (
    isOverdue(ticket) ||
    isDueSoon(ticket) ||
    (!isCompleted(ticket) && !ticket.assignedTo) ||
    (!isCompleted(ticket) && getEntityId(ticket.assignedTo) === currentUserId)
  );
}

function getQueueBadges(ticket) {
  const badges = [];
  if (isOverdue(ticket)) badges.push({ label: "Overdue", tone: "danger" });
  else if (isDueSoon(ticket)) badges.push({ label: "Due soon", tone: "warning" });
  if (!isCompleted(ticket) && !ticket.assignedTo) badges.push({ label: "Unassigned", tone: "info" });
  if (isWaitingRequester(ticket)) badges.push({ label: "Waiting requester", tone: "neutral" });
  return badges;
}

function isCompleted(ticket) {
  return ["resolved", "closed"].includes(ticket.status);
}

function isOverdue(ticket) {
  if (!ticket.dueDate || isCompleted(ticket)) return false;
  return new Date(ticket.dueDate).getTime() < Date.now();
}

function isDueSoon(ticket) {
  if (!ticket.dueDate || isCompleted(ticket) || isOverdue(ticket)) return false;
  const diff = new Date(ticket.dueDate).getTime() - Date.now();
  return diff <= 4 * 60 * 60 * 1000;
}

function isWaitingRequester(ticket) {
  return ["resolved", "closed"].includes(ticket.status) && !ticket.satisfactionScore;
}

function getEntityId(entity) {
  return String(entity?._id || entity?.id || entity || "");
}

const emptyQueueMessages = {
  now: {
    title: "ยังไม่มีงานเร่งด่วนตอนนี้",
    description: "ลองดู All หรือค้นหาจากเลข ticket เพื่อเช็กงานทั่วไปได้",
  },
  overdue: {
    title: "ไม่มีงานเกินกำหนด",
    description: "ดีมาก คิวนี้สะอาดแล้ว กลับไปดู Due soon เพื่อกันงานหลุด SLA",
  },
  dueSoon: {
    title: "ไม่มีงานใกล้ถึงกำหนด",
    description: "ยังไม่มี ticket ที่ต้องรีบ follow-up ใน 4 ชั่วโมงข้างหน้า",
  },
  unassigned: {
    title: "ไม่มีงานที่ยังไม่มอบหมาย",
    description: "งานใหม่ถูก assign เรียบร้อยแล้ว หรือใช้ All เพื่อดูงานทั้งหมด",
  },
  assignedToMe: {
    title: "ยังไม่มีงานที่มอบหมายให้คุณ",
    description: "ถ้ามีงานใหม่ ระบบจะแจ้งเตือน realtime ผ่าน notification",
  },
  waitingRequester: {
    title: "ไม่มีงานที่รอ requester",
    description: "เมื่อปิดงานแล้วแต่ยังไม่มี feedback งานจะมาอยู่คิวนี้",
  },
  all: {
    title: "ไม่พบ ticket",
    description: "ลองล้าง search/filter หรือสร้าง ticket ใหม่จากหน้า Add Ticket",
  },
};

const statusOptions = [
  { value: "all", label: "ทุกสถานะ / All", prefix: "A" },
  { value: "open", label: "เปิดใหม่ / Open", prefix: "O" },
  { value: "in_progress", label: "กำลังดำเนินการ / In Progress", prefix: "IP" },
  { value: "resolved", label: "แก้ไขแล้ว / Resolved", prefix: "R" },
  { value: "closed", label: "ปิดงาน / Closed", prefix: "C" },
];

const priorityOptions = [
  { value: "low", label: "Low / ไม่เร่ง", prefix: "L" },
  { value: "medium", label: "Medium / ปกติ", prefix: "M" },
  { value: "high", label: "High / ด่วน", prefix: "H" },
  { value: "critical", label: "Critical / วิกฤต", prefix: "C" },
];

function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default TicketTable;
