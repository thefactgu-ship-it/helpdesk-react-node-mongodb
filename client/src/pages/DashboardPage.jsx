import DashboardAnalytics from "../components/DashboardAnalytics";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  MessageSquareMore,
  PlusCircle,
  Search,
} from "lucide-react";

function DashboardPage({ currentUser, darkMode, loading, onNavigate, t, tickets }) {
  if (loading && !tickets.length) {
    return (
      <div className="space-y-5">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80"
            />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {["xl:col-span-3", "xl:col-span-6", "xl:col-span-3"].map(
            (className, index) => (
              <div
                key={index}
                className={`${className} h-72 animate-pulse rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/80`}
              />
            ),
          )}
        </section>
      </div>
    );
  }

  if (currentUser?.role === "User") {
    return (
      <RequesterDashboard
        currentUser={currentUser}
        loading={loading}
        onNavigate={onNavigate}
        t={t}
        tickets={tickets}
      />
    );
  }

  if (!tickets.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-sm font-black text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-400/20">
          IT
        </div>
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          No tickets yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Dashboard metrics will appear after helpdesk tickets are created.
        </p>
      </section>
    );
  }

  return <DashboardAnalytics darkMode={darkMode} tickets={tickets} />;
}

function RequesterDashboard({ currentUser, loading, onNavigate, t, tickets }) {
  const currentUserId = getEntityId(currentUser);
  const text = getRequesterHomeText(t);
  const ownTickets = tickets.filter((ticket) => isOwnTicket(ticket, currentUserId));
  const activeMine = ownTickets.filter((ticket) => !isCompleted(ticket));
  const waitingFeedback = ownTickets.filter((ticket) => isWaitingFeedback(ticket));
  const inProgressMine = ownTickets.filter((ticket) => ticket.status === "in_progress");
  const departmentTickets = tickets
    .filter((ticket) => !isOwnTicket(ticket, currentUserId) && !isCompleted(ticket))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
              {text.eyebrow}
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              {text.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {text.description}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[24rem]">
            <button
              type="button"
              onClick={() => onNavigate("add-ticket")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              <PlusCircle className="h-5 w-5" aria-hidden="true" />
              {text.createTicket}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("tickets")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-800"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
              {text.checkDepartment}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <RequesterStat
          detail={text.inProgressDetail}
          icon={Clock3}
          label={text.inProgressMine}
          value={inProgressMine.length}
        />
        <RequesterStat
          detail={text.waitingFeedbackDetail}
          icon={MessageSquareMore}
          label={text.waitingFeedback}
          value={waitingFeedback.length}
        />
        <RequesterStat
          detail={text.departmentDetail}
          icon={Search}
          label={text.departmentActive}
          value={departmentTickets.length}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RequesterPanel
          actionLabel={text.viewQueue}
          icon={ClipboardList}
          onAction={() => onNavigate("tickets")}
          title={text.myTickets}
        >
          <TicketList
            empty={loading ? t("common.loadingPage") : text.noMyTickets}
            emptyAction={text.createTicket}
            onEmptyAction={() => onNavigate("add-ticket")}
            tickets={activeMine.slice(0, 5)}
          />
        </RequesterPanel>

        <RequesterPanel
          actionLabel={text.checkQueue}
          icon={Search}
          onAction={() => onNavigate("tickets")}
          title={text.departmentTickets}
        >
          <TicketList
            empty={loading ? t("common.loadingPage") : text.noDepartmentTickets}
            emptyAction={text.createTicket}
            onEmptyAction={() => onNavigate("add-ticket")}
            summaryOnly
            summaryOnlyLabel={text.summaryOnly}
            tickets={departmentTickets}
          />
        </RequesterPanel>
      </section>

      {waitingFeedback.length > 0 && (
        <RequesterPanel
          actionLabel={text.giveFeedback}
          icon={CheckCircle2}
          onAction={() => onNavigate("tickets")}
          title={text.feedbackTitle}
        >
          <TicketList tickets={waitingFeedback.slice(0, 4)} />
        </RequesterPanel>
      )}
    </div>
  );
}

function getRequesterHomeText(t) {
  return {
    activeMine: pickText(t, "requesterHome.activeMine", "เรื่องของฉันที่ยังเปิดอยู่"),
    checkDepartment: pickText(t, "requesterHome.checkDepartment", "เช็กเรื่องในแผนก"),
    checkQueue: pickText(t, "requesterHome.checkQueue", "เช็กรายการ"),
    createTicket: pickText(t, "requesterHome.createTicket", "แจ้งปัญหาใหม่"),
    departmentActive: pickText(t, "requesterHome.departmentActive", "เรื่องในแผนก"),
    departmentDetail: pickText(t, "requesterHome.departmentDetail", "เช็กก่อนแจ้งซ้ำ"),
    departmentTickets: pickText(t, "requesterHome.departmentTickets", "ในแผนกเดียวกัน"),
    description: pickText(
      t,
      "requesterHome.description",
      "สร้างคำขอใหม่ให้ทีม IT หรือเช็กเรื่องในแผนกก่อนเพื่อไม่ต้องแจ้งซ้ำ",
    ),
    eyebrow: pickText(t, "requesterHome.eyebrow", "พื้นที่แจ้งปัญหา"),
    feedbackTitle: pickText(t, "requesterHome.feedbackTitle", "รอ feedback จากฉัน"),
    giveFeedback: pickText(t, "requesterHome.giveFeedback", "ให้ feedback"),
    inProgressDetail: pickText(t, "requesterHome.inProgressDetail", "ทีม IT กำลังดูแลอยู่"),
    inProgressMine: pickText(t, "requesterHome.inProgressMine", "กำลังดำเนินการ"),
    myTickets: pickText(t, "requesterHome.myTickets", "คำขอของฉัน"),
    noDepartmentTickets: pickText(t, "requesterHome.noDepartmentTickets", "ตอนนี้ยังไม่มีเรื่องที่เปิดอยู่ในแผนก กดแจ้งปัญหาใหม่ได้เลย"),
    noMyTickets: pickText(t, "requesterHome.noMyTickets", "ตอนนี้ไม่มีเรื่องค้าง กดแจ้งปัญหาใหม่ได้เลยเมื่อมีเรื่องให้ช่วย"),
    title: pickText(t, "requesterHome.title", "แจ้งปัญหาได้เร็วขึ้น"),
    summaryOnly: pickText(t, "queue.summaryOnly", "ดูสรุป"),
    viewQueue: pickText(t, "requesterHome.viewQueue", "ดูคำขอ"),
    waitingFeedback: pickText(t, "requesterHome.waitingFeedback", "รอฉันยืนยัน"),
    waitingFeedbackDetail: pickText(t, "requesterHome.waitingFeedbackDetail", "ช่วยยืนยันเมื่อแก้เสร็จ"),
  };
}

function pickText(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

function RequesterStat({ detail, icon: Icon, label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-2xl font-black text-slate-950 dark:text-white">{value}</p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          {detail && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {detail}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function RequesterPanel({ actionLabel, children, icon: Icon, onAction, title }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function TicketList({ empty, emptyAction, onEmptyAction, summaryOnly = false, summaryOnlyLabel = "", tickets = [] }) {
  if (!tickets.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">{empty}</p>
        {emptyAction && onEmptyAction && (
          <button
            type="button"
            onClick={onEmptyAction}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-700"
          >
            {emptyAction}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <article
          key={ticket._id || ticket.id}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-300">
                {ticket.ticketNumber}
              </p>
              <h4 className="mt-1 line-clamp-2 text-sm font-black text-slate-950 dark:text-white">
                {ticket.title}
              </h4>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700">
              {formatStatus(ticket.status)}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {ticket.category} / {ticket.departmentName || ticket.department}
            {summaryOnly && summaryOnlyLabel ? ` / ${summaryOnlyLabel}` : ""}
          </p>
        </article>
      ))}
    </div>
  );
}

function getEntityId(entity) {
  return String(entity?._id || entity?.id || entity || "");
}

function isOwnTicket(ticket, currentUserId) {
  if (ticket.requesterScope === "department") return false;
  return (
    getEntityId(ticket.createdBy) === currentUserId ||
    getEntityId(ticket.requesterUserId) === currentUserId ||
    getEntityId(ticket.assignedTo) === currentUserId
  );
}

function isCompleted(ticket) {
  return ["resolved", "closed"].includes(ticket.status);
}

function isWaitingFeedback(ticket) {
  return isCompleted(ticket) && !ticket.satisfactionScore;
}

function formatStatus(status = "") {
  return status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default DashboardPage;
