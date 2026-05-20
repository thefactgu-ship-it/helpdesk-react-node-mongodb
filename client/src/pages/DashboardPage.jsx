import DashboardAnalytics from "../components/DashboardAnalytics";
import ManagerOperationsDashboard from "../components/ManagerOperationsDashboard";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Gauge,
  MessageSquareMore,
  PlusCircle,
  Search,
  ShieldAlert,
  TimerReset,
  UserRoundX,
  UsersRound,
} from "lucide-react";

function DashboardPage({
  currentUser,
  darkMode,
  hotels = [],
  loading,
  onNavigate,
  selectedHotelId = "all",
  t,
  tickets,
}) {
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

  if (currentUser?.role === "GroupAdmin") {
    return (
      <GroupAdminDashboard
        hotels={hotels}
        loading={loading}
        onNavigate={onNavigate}
        selectedHotelId={selectedHotelId}
        t={t}
        tickets={tickets}
      />
    );
  }

  if (currentUser?.role === "Manager") {
    return (
      <ManagerOperationsDashboard
        darkMode={darkMode}
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

function GroupAdminDashboard({
  hotels = [],
  loading,
  onNavigate,
  selectedHotelId,
  t,
  tickets = [],
}) {
  const text = getGroupAdminDashboardText(t);
  const data = buildGroupAdminDashboardData(tickets, hotels, selectedHotelId, text);
  const showAllHotels = !selectedHotelId || selectedHotelId === "all";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              {data.scopeLabel}
            </div>
            <h3 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
              {text.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {text.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[32rem]">
            <button
              type="button"
              onClick={() => onNavigate("tickets")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 sm:col-span-3"
            >
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
              {text.openQueue}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("monthly-report")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              {text.monthlyReport}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("user-management")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              {text.manageUsers}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("hotels")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              {text.manageHotels}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <GroupAdminKpi
          detail={text.activeDetail}
          icon={ClipboardList}
          label={text.activeTickets}
          value={data.activeTickets.length}
        />
        <GroupAdminKpi
          detail={text.riskDetail}
          icon={ShieldAlert}
          label={text.riskTickets}
          tone={data.riskTickets.length ? "rose" : "blue"}
          value={data.riskTickets.length}
        />
        <GroupAdminKpi
          detail={text.overdueDetail}
          icon={AlertTriangle}
          label={text.overdueTickets}
          tone={data.overdueTickets.length ? "rose" : "blue"}
          value={data.overdueTickets.length}
        />
        <GroupAdminKpi
          detail={text.unassignedDetail}
          icon={UserRoundX}
          label={text.unassignedUrgent}
          tone={data.unassignedUrgent.length ? "amber" : "blue"}
          value={data.unassignedUrgent.length}
        />
        <GroupAdminKpi
          detail={showAllHotels ? text.hotelWatchDetail : text.selectedHotelDetail}
          icon={Gauge}
          label={text.hotelsToWatch}
          tone={data.watchHotelCount ? "amber" : "blue"}
          value={data.watchHotelCount}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <GroupAdminPanel
          actionLabel={text.openQueue}
          className="xl:col-span-7"
          icon={TimerReset}
          onAction={() => onNavigate("tickets")}
          title={text.needsAttention}
        >
          {data.riskTickets.length ? (
            <div className="space-y-3">
              {data.riskTickets.slice(0, 6).map((ticket) => (
                <GroupAdminRiskItem
                  key={ticket._id || ticket.id}
                  text={text}
                  ticket={ticket}
                />
              ))}
            </div>
          ) : (
            <GroupAdminEmptyState
              loading={loading}
              loadingLabel={text.loading}
              message={text.noRiskTickets}
            />
          )}
        </GroupAdminPanel>

        <GroupAdminPanel
          className="xl:col-span-5"
          icon={Building2}
          title={text.hotelOverview}
        >
          {data.hotelCards.length ? (
            <div className="space-y-3">
              {data.hotelCards.map((hotel) => (
                <GroupAdminHotelCard
                  key={hotel.id}
                  hotel={hotel}
                  text={text}
                />
              ))}
            </div>
          ) : (
            <GroupAdminEmptyState
              loading={loading}
              loadingLabel={text.loading}
              message={text.noHotelData}
            />
          )}
        </GroupAdminPanel>

        <GroupAdminPanel
          className="xl:col-span-6"
          icon={BarChart3}
          title={text.recurringIssues}
        >
          <GroupAdminRankList
            empty={text.noCategoryData}
            items={data.categoryData}
            total={tickets.length}
          />
        </GroupAdminPanel>

        <GroupAdminPanel
          className="xl:col-span-6"
          icon={UsersRound}
          title={text.teamLoad}
        >
          <GroupAdminRankList
            empty={text.noWorkloadData}
            items={data.workloadData}
            total={data.activeTickets.length}
          />
        </GroupAdminPanel>
      </section>
    </div>
  );
}

function buildGroupAdminDashboardData(tickets, hotels, selectedHotelId, text) {
  const now = new Date();
  const activeTickets = tickets.filter((ticket) => !isCompleted(ticket));
  const overdueTickets = activeTickets.filter((ticket) => isTicketOverdue(ticket, now));
  const unassignedUrgent = activeTickets.filter(
    (ticket) => !ticket.assignedTo && ["critical", "high"].includes(ticket.priority),
  );
  const riskTickets = activeTickets
    .map((ticket) => ({
      ...ticket,
      riskRank: getTicketRiskRank(ticket, now),
      riskLabel: getTicketRiskLabel(ticket, now, text),
    }))
    .filter((ticket) => ticket.riskRank < 99)
    .sort((a, b) => {
      const rankDiff = a.riskRank - b.riskRank;
      if (rankDiff) return rankDiff;
      return new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt);
    });

  const hotelCards = buildHotelCards(tickets, hotels, selectedHotelId, text, now);
  const categoryData = buildRankData(tickets, (ticket) => ticket.category || text.unknownCategory, 5);
  const workloadData = buildRankData(
    activeTickets,
    (ticket) => getAssigneeName(ticket, text.unassignedOwner),
    5,
  );
  const selectedHotel = hotels.find((hotel) => getEntityId(hotel) === String(selectedHotelId));
  const scopeLabel =
    selectedHotelId && selectedHotelId !== "all"
      ? getHotelLabel(selectedHotel) || text.selectedHotel
      : text.allHotels;

  return {
    activeTickets,
    categoryData,
    hotelCards,
    overdueTickets,
    riskTickets,
    scopeLabel,
    unassignedUrgent,
    watchHotelCount: hotelCards.filter((hotel) => hotel.level !== "normal").length,
    workloadData,
  };
}

function buildHotelCards(tickets, hotels, selectedHotelId, text, now) {
  const allScope = !selectedHotelId || selectedHotelId === "all";
  const visibleHotels = allScope
    ? hotels
    : hotels.filter((hotel) => getEntityId(hotel) === String(selectedHotelId));
  const fallbackHotelIds = [...new Set(tickets.map((ticket) => getTicketHotelId(ticket)).filter(Boolean))];
  const hotelItems = visibleHotels.length
    ? visibleHotels
    : fallbackHotelIds.map((id) => ({ _id: id, name: id, code: id }));

  return hotelItems
    .map((hotel) => {
      const hotelId = getEntityId(hotel);
      const hotelTickets = tickets.filter((ticket) => getTicketHotelId(ticket) === hotelId);
      const active = hotelTickets.filter((ticket) => !isCompleted(ticket));
      const overdue = active.filter((ticket) => isTicketOverdue(ticket, now));
      const urgent = active.filter((ticket) => ["critical", "high"].includes(ticket.priority));
      const unassigned = active.filter((ticket) => !ticket.assignedTo);
      const level = overdue.length || unassigned.filter((ticket) => ["critical", "high"].includes(ticket.priority)).length
        ? "attention"
        : urgent.length || active.length >= 5
          ? "watch"
          : "normal";

      return {
        active: active.length,
        id: hotelId || getHotelLabel(hotel),
        label: getHotelLabel(hotel) || text.unknownHotel,
        level,
        overdue: overdue.length,
        statusLabel: getHotelStatusLabel(level, text),
        unassigned: unassigned.length,
        urgent: urgent.length,
      };
    })
    .sort((a, b) => {
      const levelRank = { attention: 0, watch: 1, normal: 2 };
      const levelDiff = levelRank[a.level] - levelRank[b.level];
      if (levelDiff) return levelDiff;
      return b.active - a.active;
    })
    .slice(0, allScope ? 6 : 1);
}

function buildRankData(items, getLabel, limit) {
  return Object.entries(
    items.reduce((acc, item) => {
      const label = getLabel(item);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function getGroupAdminDashboardText(t) {
  return {
    activeDetail: pickText(t, "groupAdminDashboard.activeDetail", "งานที่ยังไม่ปิดใน scope นี้"),
    activeShort: pickText(t, "groupAdminDashboard.activeShort", "เปิดอยู่"),
    activeTickets: pickText(t, "groupAdminDashboard.activeTickets", "งานที่ยังเปิดอยู่"),
    allHotels: pickText(t, "groupAdminDashboard.allHotels", "ทุกโรงแรม"),
    description: pickText(
      t,
      "groupAdminDashboard.description",
      "มองภาพรวมหลายโรงแรม จับงานเสี่ยง และเข้าไปจัดการจุดที่ต้องตัดสินใจได้ทันที",
    ),
    hotelOverview: pickText(t, "groupAdminDashboard.hotelOverview", "ภาพรวมโรงแรม"),
    hotelWatchDetail: pickText(t, "groupAdminDashboard.hotelWatchDetail", "โรงแรมที่มีสัญญาณต้องติดตาม"),
    hotelsToWatch: pickText(t, "groupAdminDashboard.hotelsToWatch", "โรงแรมที่ต้องติดตาม"),
    manageHotels: pickText(t, "groupAdminDashboard.manageHotels", "จัดการโรงแรม"),
    manageUsers: pickText(t, "groupAdminDashboard.manageUsers", "จัดการผู้ใช้"),
    monthlyReport: pickText(t, "groupAdminDashboard.monthlyReport", "รายงานรายเดือน"),
    needsAttention: pickText(t, "groupAdminDashboard.needsAttention", "ต้องดูตอนนี้"),
    noCategoryData: pickText(t, "groupAdminDashboard.noCategoryData", "ยังไม่มีข้อมูลหมวดปัญหา"),
    noHotelData: pickText(t, "groupAdminDashboard.noHotelData", "ยังไม่มีข้อมูลโรงแรมใน scope นี้"),
    noRiskTickets: pickText(t, "groupAdminDashboard.noRiskTickets", "ตอนนี้ยังไม่มีงานเสี่ยงที่ต้องรีบดู"),
    noWorkloadData: pickText(t, "groupAdminDashboard.noWorkloadData", "ยังไม่มีงาน active สำหรับดูภาระทีม"),
    normal: pickText(t, "groupAdminDashboard.normal", "ปกติ"),
    openQueue: pickText(t, "groupAdminDashboard.openQueue", "ดูคิวงานที่ต้องจัดการ"),
    ownerLabel: pickText(t, "groupAdminDashboard.ownerLabel", "ผู้รับผิดชอบ"),
    overdueDetail: pickText(t, "groupAdminDashboard.overdueDetail", "งาน active ที่เลยกำหนด"),
    overdueRisk: pickText(t, "groupAdminDashboard.overdueRisk", "เกินกำหนด"),
    overdueShort: pickText(t, "groupAdminDashboard.overdueShort", "เกินกำหนด"),
    overdueTickets: pickText(t, "groupAdminDashboard.overdueTickets", "เกินกำหนด"),
    priorityLabel: pickText(t, "groupAdminDashboard.priorityLabel", "ความเร่งด่วน"),
    recurringIssues: pickText(t, "groupAdminDashboard.recurringIssues", "ปัญหาซ้ำที่พบมาก"),
    riskDetail: pickText(t, "groupAdminDashboard.riskDetail", "เกินกำหนด ใกล้กำหนด หรือยังไม่มอบหมาย"),
    riskTickets: pickText(t, "groupAdminDashboard.riskTickets", "งานเสี่ยง"),
    selectedHotel: pickText(t, "groupAdminDashboard.selectedHotel", "โรงแรมที่เลือก"),
    selectedHotelDetail: pickText(t, "groupAdminDashboard.selectedHotelDetail", "สถานะของโรงแรมที่เลือก"),
    teamLoad: pickText(t, "groupAdminDashboard.teamLoad", "ภาระงานทีม"),
    title: pickText(t, "groupAdminDashboard.title", "ศูนย์ควบคุมหลายโรงแรม"),
    dueLabel: pickText(t, "groupAdminDashboard.dueLabel", "กำหนด"),
    statusLabel: pickText(t, "groupAdminDashboard.statusLabel", "สถานะ"),
    unassignedDetail: pickText(t, "groupAdminDashboard.unassignedDetail", "High/Critical ที่ยังไม่มีผู้รับผิดชอบ"),
    unassignedOwner: pickText(t, "groupAdminDashboard.unassignedOwner", "ยังไม่มอบหมาย"),
    unassignedUrgent: pickText(t, "groupAdminDashboard.unassignedUrgent", "ด่วนยังไม่มอบหมาย"),
    unknownCategory: pickText(t, "groupAdminDashboard.unknownCategory", "ไม่ระบุหมวด"),
    unknownHotel: pickText(t, "groupAdminDashboard.unknownHotel", "ไม่ระบุโรงแรม"),
    watch: pickText(t, "groupAdminDashboard.watch", "เฝ้าดู"),
    attention: pickText(t, "groupAdminDashboard.attention", "ต้องติดตาม"),
    dueSoonRisk: pickText(t, "groupAdminDashboard.dueSoonRisk", "ใกล้ครบกำหนด"),
    urgentUnassignedRisk: pickText(t, "groupAdminDashboard.urgentUnassignedRisk", "ด่วนยังไม่มอบหมาย"),
    urgentRisk: pickText(t, "groupAdminDashboard.urgentRisk", "งานด่วน"),
    urgentShort: pickText(t, "groupAdminDashboard.urgentShort", "ด่วน"),
    loading: pickText(t, "common.loadingPage", "กำลังโหลดหน้า..."),
  };
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

function GroupAdminKpi({ detail, icon: Icon, label, tone = "blue", value }) {
  const toneClasses = {
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-black text-slate-950 dark:text-white">
            {Number(value || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-sm font-black text-slate-700 dark:text-slate-200">
            {label}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {detail}
          </p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function GroupAdminPanel({ actionLabel, children, className = "", icon: Icon, onAction, title }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function GroupAdminRiskItem({ text, ticket }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-100 dark:bg-slate-950 dark:text-blue-200 dark:ring-blue-400/20">
              {ticket.ticketNumber || "-"}
            </span>
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/20">
              {ticket.riskLabel}
            </span>
          </div>
          <h4 className="mt-2 line-clamp-2 text-sm font-black text-slate-950 dark:text-white">
            {ticket.title}
          </h4>
          <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {getTicketHotelLabel(ticket, text.unknownHotel)} / {ticket.category || text.unknownCategory}
          </p>
        </div>
        <div className="grid min-w-[9rem] grid-cols-2 gap-2 text-xs">
          <GroupAdminMeta label={text.priorityLabel} value={formatStatus(ticket.priority || "-")} />
          <GroupAdminMeta label={text.dueLabel} value={formatDate(ticket.dueDate) || "-"} />
          <GroupAdminMeta label={text.ownerLabel} value={getAssigneeName(ticket, text.unassignedOwner)} />
          <GroupAdminMeta label={text.statusLabel} value={formatStatus(ticket.status || "-")} />
        </div>
      </div>
    </article>
  );
}

function GroupAdminHotelCard({ hotel, text }) {
  const toneClass =
    hotel.level === "attention"
      ? "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/20"
      : hotel.level === "watch"
        ? "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/20"
        : "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20";

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-black text-slate-950 dark:text-white">
            {hotel.label}
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {hotel.active.toLocaleString()} {text.activeShort} / {hotel.overdue.toLocaleString()} {text.overdueShort}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${toneClass}`}>
          {hotel.statusLabel}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <GroupAdminMiniMetric label={text.urgentShort} value={hotel.urgent} />
        <GroupAdminMiniMetric label={text.unassignedOwner} value={hotel.unassigned} />
        <GroupAdminMiniMetric label={text.overdueTickets} value={hotel.overdue} />
      </div>
    </article>
  );
}

function GroupAdminRankList({ empty, items, total }) {
  if (!items.length) {
    return <GroupAdminEmptyState message={empty} />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const percentValue = total ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-black text-slate-700 dark:text-slate-200">
                {item.label}
              </span>
              <span className="shrink-0 text-slate-500 dark:text-slate-400">
                {item.value.toLocaleString()} / {percentValue}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${Math.max(percentValue, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupAdminMeta({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 truncate font-bold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function GroupAdminMiniMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-center ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
      <p className="text-lg font-black text-slate-950 dark:text-white">{value}</p>
      <p className="truncate text-[10px] font-bold text-slate-400">{label}</p>
    </div>
  );
}

function GroupAdminEmptyState({ loading, loadingLabel = "Loading...", message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {loading ? loadingLabel : message}
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

function getTicketHotelId(ticket) {
  return getEntityId(ticket?.hotelId);
}

function getHotelLabel(hotel) {
  if (!hotel) return "";
  if (typeof hotel === "string") return hotel;
  return [hotel.code, hotel.name].filter(Boolean).join(" / ") || getEntityId(hotel);
}

function getTicketHotelLabel(ticket, fallback) {
  const hotel = ticket?.hotelId;
  if (hotel && typeof hotel === "object") return getHotelLabel(hotel) || fallback;
  return getTicketHotelId(ticket) || fallback;
}

function getAssigneeName(ticket, fallback = "Unassigned") {
  if (!ticket?.assignedTo) return fallback;
  if (typeof ticket.assignedTo === "string") return ticket.assignedTo;
  return ticket.assignedTo.name || ticket.assignedTo.email || fallback;
}

function hoursUntil(value, now = new Date()) {
  if (!value) return null;
  return Math.ceil((new Date(value) - now) / 3600000);
}

function isTicketOverdue(ticket, now = new Date()) {
  if (isCompleted(ticket)) return false;
  if (ticket.isOverdue) return true;
  return ticket.dueDate ? new Date(ticket.dueDate) < now : false;
}

function isTicketDueSoon(ticket, now = new Date()) {
  if (isCompleted(ticket) || !ticket.dueDate || isTicketOverdue(ticket, now)) return false;
  const remainingHours = hoursUntil(ticket.dueDate, now);
  return remainingHours !== null && remainingHours <= 4;
}

function getTicketRiskRank(ticket, now = new Date()) {
  if (isTicketOverdue(ticket, now)) return 0;
  if (isTicketDueSoon(ticket, now)) return 1;
  if (!ticket.assignedTo && ticket.priority === "critical") return 2;
  if (!ticket.assignedTo && ticket.priority === "high") return 3;
  if (ticket.priority === "critical") return 4;
  if (ticket.priority === "high") return 5;
  return 99;
}

function getTicketRiskLabel(ticket, now, text) {
  if (isTicketOverdue(ticket, now)) return text.overdueRisk;
  if (isTicketDueSoon(ticket, now)) return text.dueSoonRisk;
  if (!ticket.assignedTo && ["critical", "high"].includes(ticket.priority)) {
    return text.urgentUnassignedRisk;
  }
  return ["critical", "high"].includes(ticket.priority) ? text.urgentRisk : text.riskTickets;
}

function getHotelStatusLabel(level, text) {
  if (level === "attention") return text.attention;
  if (level === "watch") return text.watch;
  return text.normal;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
  });
}

function formatStatus(status = "") {
  return status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default DashboardPage;
