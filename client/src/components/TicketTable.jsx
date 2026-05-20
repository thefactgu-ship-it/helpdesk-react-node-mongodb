import { useEffect, useMemo, useState } from "react";
import Badge from "./Badge";
import { GroupAdminControlView, GroupAdminQueueKpis } from "./GroupAdminControlView";
import QueueActionMenu from "./QueueActionMenu";
import RequesterQueueCards from "./RequesterQueueCards";
import SkeletonRow from "./SkeletonRow";
import StatusPill from "./StatusPill";
import ThemedSelect from "./ThemedSelect";
import WorkQueueTicketDrawer from "./WorkQueueTicketDrawer";
import {
  canManageTickets as roleCanManageTickets,
  canUpdateTicketStatus as roleCanUpdateTicketStatus,
  canUseGroupControlQueue,
  getWorkQueueProfile,
} from "../config/rolePolicy";
import {
  buildGroupAdminOwnerOptions,
  buildGroupAdminQueueKpis,
  buildPriorityOptions,
  buildStatusOptions,
  canViewTicketDetails,
  getAssignableUsersForTicket,
  getEmptyQueueMessage,
  getEntityId,
  getGroupAdminEmptyQueueMessage,
  getPriorityLabel,
  getQueueBadges,
  getRequesterEmptyQueueMessage,
  getStatusLabel,
  isCompleted,
  isDueSoon,
  isGroupAdminRiskTicket,
  isOverdue,
  isWaitingRequester,
  matchesGroupAdminOwnerFilter,
} from "../utils/ticketQueueUtils";

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
  filterPriority = "all",
  updatePriority,
  updateDueDate,
  updateStatus,
  deleteTicket,
  hotels = [],
  currentPage,
  setCurrentPage,
  selectedHotelId = "all",
  setFilterPriority,
  ticketsPerPage = 5,
  onViewTicket,
  setSelectedHotelId,
  currentUser,
  users = [],
  t,
}) {
  const [activeQueue, setActiveQueue] = useState("now");
  const [groupAdminOwnerFilter, setGroupAdminOwnerFilter] = useState("all");
  const [drawerTicket, setDrawerTicket] = useState(null);
  const [openActionTicketId, setOpenActionTicketId] = useState(null);
  const workQueueProfile = getWorkQueueProfile(currentUser?.role);
  const canManageTickets = roleCanManageTickets(currentUser?.role);
  const isGroupAdmin = canUseGroupControlQueue(currentUser?.role);
  const isRequester = workQueueProfile === "requester";
  const isAgentQueue = workQueueProfile === "agent";
  const requesterText = getRequesterQueueText(t);
  const groupAdminText = getGroupAdminQueueText(t);
  const staffQueueText = getStaffQueueText(t, workQueueProfile);
  const assignableUsers = users.filter((user) =>
    ["admin", "manager", "agent", "staff"].includes(
      String(user.role || "").toLowerCase(),
    ),
  );
  const currentUserId = getEntityId(currentUser);
  const queueOptions = useMemo(
    () => buildQueueOptions(tickets, currentUserId, t, workQueueProfile),
    [currentUserId, tickets, t, workQueueProfile],
  );
  const validQueueIds = useMemo(
    () => queueOptions.map((queue) => queue.id),
    [queueOptions],
  );
  const preferredQueue = isRequester ? "mine" : isAgentQueue ? "assignedToMe" : "now";
  const activeQueueId = validQueueIds.includes(activeQueue) ? activeQueue : preferredQueue;
  const queueTickets = useMemo(
    () => tickets.filter((ticket) => matchesQueue(ticket, activeQueueId, currentUserId, workQueueProfile)),
    [activeQueueId, currentUserId, tickets, workQueueProfile],
  );
  const displayTickets = useMemo(
    () =>
      isGroupAdmin
        ? queueTickets.filter((ticket) => matchesGroupAdminOwnerFilter(ticket, groupAdminOwnerFilter))
        : queueTickets,
    [groupAdminOwnerFilter, isGroupAdmin, queueTickets],
  );
  const activeDrawerTicket = useMemo(() => {
    if (!drawerTicket) return null;
    const drawerTicketId = drawerTicket._id || drawerTicket.id;
    return tickets.find((ticket) => (ticket._id || ticket.id) === drawerTicketId) || drawerTicket;
  }, [drawerTicket, tickets]);
  const totalPages = Math.max(1, Math.ceil(displayTickets.length / ticketsPerPage));
  const visibleTickets = displayTickets.slice(
    (currentPage - 1) * ticketsPerPage,
    currentPage * ticketsPerPage,
  );
  const statusOptions = buildStatusOptions(t);
  const priorityOptions = buildPriorityOptions(t);
  const groupAdminKpis = useMemo(() => buildGroupAdminQueueKpis(tickets), [tickets]);
  const staffKpis = useMemo(() => buildStaffQueueKpis(tickets, currentUserId, workQueueProfile), [currentUserId, tickets, workQueueProfile]);
  const groupAdminOwnerOptions = useMemo(
    () => buildGroupAdminOwnerOptions(tickets, users, groupAdminText),
    [groupAdminText, tickets, users],
  );
  const hotelOptions = useMemo(
    () => [
      { value: "all", label: t("common.allHotels"), meta: t("common.groupDashboard"), prefix: "ALL" },
      ...hotels.map((hotel) => ({
        value: getEntityId(hotel),
        label: [hotel.code, hotel.name].filter(Boolean).join(" / ") || getEntityId(hotel),
        meta: hotel.region || "Hotel",
        prefix: String(hotel.code || hotel.name || "HT").slice(0, 2),
      })),
    ],
    [hotels, t],
  );
  const canUpdateTicketStatus = (ticket) => roleCanUpdateTicketStatus(currentUser?.role, currentUserId, ticket);

  const openQueueDrawer = (ticket) => {
    if (isRequester) return;
    setDrawerTicket(ticket);
    setOpenActionTicketId(null);
  };

  const closeQueueDrawer = () => setDrawerTicket(null);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, setCurrentPage, totalPages]);

  const handleQueueChange = (queueId) => {
    setActiveQueue(queueId);
    setCurrentPage(1);
    setOpenActionTicketId(null);
  };

  return (
    <section className="mt-6 min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
      <div className="mb-5 flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 lg:max-w-sm">
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {isGroupAdmin ? groupAdminText.heading : isRequester ? requesterText.heading : staffQueueText.heading}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isGroupAdmin ? groupAdminText.description : isRequester ? requesterText.description : staffQueueText.description}
          </p>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-4xl xl:flex-1 2xl:grid-cols-3">
          <input
            type="text"
            placeholder={t("queue.searchPlaceholder")}
            value={search}
            disabled={loading}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
          />

          <ThemedSelect
            className="w-full min-w-0"
            size="sm"
            value={filterStatus}
            disabled={loading}
            onChange={setFilterStatus}
            options={statusOptions}
          />
          {isGroupAdmin && setFilterPriority && (
            <ThemedSelect
              className="w-full min-w-0"
              size="sm"
              value={filterPriority}
              disabled={loading}
              onChange={setFilterPriority}
              options={[{ value: "all", label: groupAdminText.allPriorities, prefix: "A" }, ...priorityOptions]}
            />
          )}
          {isGroupAdmin && setSelectedHotelId && (
            <ThemedSelect
              className="w-full min-w-0"
              size="sm"
              value={selectedHotelId}
              disabled={loading}
              onChange={setSelectedHotelId}
              options={hotelOptions}
            />
          )}
          {isGroupAdmin && (
            <ThemedSelect
              className="w-full min-w-0"
              size="sm"
              value={activeQueueId}
              disabled={loading}
              onChange={handleQueueChange}
              options={queueOptions.map((queue) => ({
                value: queue.id,
                label: queue.label,
                meta: `${queue.count}`,
                prefix: String(queue.label || "Q").slice(0, 2),
              }))}
            />
          )}
          {isGroupAdmin && (
            <ThemedSelect
              className="w-full min-w-0"
              size="sm"
              value={groupAdminOwnerFilter}
              disabled={loading}
              onChange={(value) => {
                setGroupAdminOwnerFilter(value);
                setCurrentPage(1);
              }}
              options={groupAdminOwnerOptions}
            />
          )}
        </div>
      </div>

      {isGroupAdmin && (
        <GroupAdminQueueKpis kpis={groupAdminKpis} text={groupAdminText} />
      )}

      {!isGroupAdmin && !isRequester && (
        <StaffQueueKpis kpis={staffKpis} text={staffQueueText} />
      )}

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {queueOptions.map((queue) => {
          const active = activeQueueId === queue.id;
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

      {isGroupAdmin ? (
        <GroupAdminControlView
          activeQueue={activeQueueId}
          assignTicket={assignTicket}
          assignableUsers={assignableUsers}
          assigningTicketId={assigningTicketId}
          currentPage={currentPage}
          deleteTicket={deleteTicket}
          deletingTicketId={deletingTicketId}
          loading={loading}
          onViewTicket={onViewTicket}
          onOpenDrawer={openQueueDrawer}
          openActionTicketId={openActionTicketId}
          priorityOptions={priorityOptions}
          queueTickets={displayTickets}
          setCurrentPage={setCurrentPage}
          setOpenActionTicketId={setOpenActionTicketId}
          statusOptions={statusOptions}
          t={t}
          text={groupAdminText}
          ticketsPerPage={ticketsPerPage}
          updatePriority={updatePriority}
          updateStatus={updateStatus}
          updatingTicketId={updatingTicketId}
          visibleTickets={visibleTickets}
        />
      ) : isRequester ? (
        <RequesterQueueCards
          activeQueue={activeQueueId}
          currentPage={currentPage}
          currentUserId={currentUserId}
          loading={loading}
          onViewTicket={onViewTicket}
          queueTickets={queueTickets}
          requesterText={requesterText}
          setCurrentPage={setCurrentPage}
          t={t}
          ticketsPerPage={ticketsPerPage}
          visibleTickets={visibleTickets}
        />
      ) : (
        <>
      <div className="space-y-3 md:hidden">
        {loading ? (
          <>
            <MobileTicketSkeleton />
            <MobileTicketSkeleton />
            <MobileTicketSkeleton />
          </>
        ) : (
          visibleTickets.map((ticket) => {
            const ticketId = ticket._id || ticket.id;
            const isUpdating = updatingTicketId === ticketId;
            const isAssigning = assigningTicketId === ticketId;
            const isDeleting = deletingTicketId === ticketId;
            const isBusy = isUpdating || isAssigning || isDeleting;

            return (
              <TicketMobileCard
                key={ticketId}
                canManageTickets={canManageTickets}
                canViewTicket={canManageTickets || canViewTicketDetails(ticket, currentUserId)}
                deleteTicket={deleteTicket}
                isBusy={isBusy}
                isDeleting={isDeleting}
                onOpenDrawer={openQueueDrawer}
                onViewTicket={onViewTicket}
                openActionTicketId={openActionTicketId}
                setOpenActionTicketId={setOpenActionTicketId}
                t={t}
                ticket={ticket}
              />
            );
          })
        )}

        {!loading && queueTickets.length === 0 && (
          <QueueEmptyState activeQueue={activeQueueId} staffQueueText={staffQueueText} t={t} />
        )}

        <PaginationControls
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          t={t}
          totalPages={totalPages}
        />
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[58rem] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-3 py-3 font-semibold">{t("queue.ticketNumber")}</th>
              <th className="px-3 font-semibold">{t("queue.issue")}</th>
              <th className="px-3 font-semibold">{t("queue.priority")}</th>
              <th className="px-3 font-semibold">{t("queue.statusLabel")}</th>
              <th className="px-3 font-semibold">{t("queue.assign")}</th>
              <th className="px-3 font-semibold">{t("queue.due")}</th>
              <th className="px-3 font-semibold">{t("queue.action")}</th>
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
                const canOpenDetails = canManageTickets || canViewTicketDetails(ticket, currentUserId);
                const ticketId = ticket._id || ticket.id;

                return (
                  <tr
                    key={ticketId}
                    className="cursor-pointer border-b last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/70"
                    onClick={() => openQueueDrawer(ticket)}
                  >
                    <td className="max-w-36 break-words px-3 py-4 font-semibold text-blue-700">
                      {ticket.ticketNumber}
                    </td>
                    <td className="min-w-0 px-3 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 line-clamp-2 break-words font-semibold text-slate-900 dark:text-white">{ticket.title}</span>
                        {getQueueBadges(ticket, t).map((badge) => (
                          <StatusPill key={badge.label} {...badge} />
                        ))}
                        {isRequester && !canViewTicketDetails(ticket, currentUserId) && (
                          <StatusPill label={requesterText.departmentSummary} tone="neutral" />
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {ticket.category} / {ticket.departmentName || ticket.department}
                        {ticket.requester ? ` / ${ticket.requester}` : ""}
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge text={getPriorityLabel(ticket.priority, t)} />
                        {ticket.criticalRequested && (
                          <StatusPill label={t("queue.criticalReview")} tone="warning" />
                        )}
                      </div>
                    </td>
                    <td className="px-3">
                      <Badge text={getStatusLabel(ticket.status, t)} />
                    </td>
                    <td className="px-3 text-slate-500 dark:text-slate-400">
                      {ticket.assignedTo?.name || t("common.unassigned")}
                    </td>
                    <td className="px-3 text-slate-500 dark:text-slate-400">
                      <DueLabel ticket={ticket} />
                    </td>
                    <td className="relative px-3" onClick={(event) => event.stopPropagation()}>
                      <QueueActionMenu
                        canDelete={canManageTickets}
                        canOpenDetails={canOpenDetails}
                        deleting={isDeleting}
                        disabled={isBusy}
                        open={openActionTicketId === ticketId}
                        onDelete={() => deleteTicket(ticketId)}
                        onOpenDrawer={() => openQueueDrawer(ticket)}
                        onToggle={() =>
                          setOpenActionTicketId(openActionTicketId === ticketId ? null : ticketId)
                        }
                        onViewFullDetail={() => onViewTicket(ticketId)}
                        t={t}
                      />
                    </td>
                  </tr>
                );
              })
            )}

            {!loading && queueTickets.length === 0 && (
              <tr>
                <td colSpan="7" className="py-8">
                  <QueueEmptyState activeQueue={activeQueueId} staffQueueText={staffQueueText} t={t} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationControls
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          t={t}
          totalPages={totalPages}
        />
      </div>
        </>
      )}

      {!isRequester && (
        <WorkQueueTicketDrawer
          assignTicket={assignTicket}
          assignableUsers={getAssignableUsersForTicket(assignableUsers, activeDrawerTicket)}
          canDelete={canManageTickets}
          canManageTickets={canManageTickets}
          canUpdateStatus={activeDrawerTicket ? canUpdateTicketStatus(activeDrawerTicket) : false}
          workQueueProfile={workQueueProfile}
          deleting={activeDrawerTicket ? deletingTicketId === (activeDrawerTicket._id || activeDrawerTicket.id) : false}
          disabled={
            activeDrawerTicket
              ? [updatingTicketId, assigningTicketId, deletingTicketId].includes(activeDrawerTicket._id || activeDrawerTicket.id)
              : false
          }
          onClose={closeQueueDrawer}
          onDelete={(ticketId) => {
            closeQueueDrawer();
            deleteTicket(ticketId);
          }}
          onViewFullDetail={(ticketId) => {
            closeQueueDrawer();
            onViewTicket(ticketId);
          }}
          priorityOptions={priorityOptions}
          statusOptions={statusOptions}
          t={t}
          ticket={activeDrawerTicket}
          updatePriority={updatePriority}
          updateDueDate={updateDueDate}
          updateStatus={updateStatus}
        />
      )}
    </section>
  );
}

function TicketMobileCard({
  canManageTickets,
  canViewTicket,
  deleteTicket,
  isBusy,
  isDeleting,
  onOpenDrawer,
  onViewTicket,
  openActionTicketId,
  setOpenActionTicketId,
  t,
  ticket,
}) {
  const ticketId = ticket._id || ticket.id;

  return (
    <article
      className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30 dark:hover:bg-slate-950"
      onClick={() => onOpenDrawer(ticket)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-300">
            {ticket.ticketNumber}
          </p>
          <h4 className="mt-1 line-clamp-2 break-words text-base font-black text-slate-950 dark:text-white">
            {ticket.title}
          </h4>
          <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
            {ticket.category} / {ticket.departmentName || ticket.department}
            {ticket.requester ? ` / ${ticket.requester}` : ""}
          </p>
        </div>
        <div className="flex max-w-full flex-wrap justify-end gap-2">
          <Badge text={getPriorityLabel(ticket.priority, t)} />
          {ticket.criticalRequested && (
            <StatusPill label={t("queue.criticalReview")} tone="warning" />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {getQueueBadges(ticket, t).map((badge) => (
          <StatusPill key={badge.label} {...badge} />
        ))}
        {!canViewTicket && (
          <StatusPill label={getRequesterQueueText(t).departmentSummary} tone="neutral" />
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <MobileMeta label={t("queue.statusLabel")} value={getStatusLabel(ticket.status, t)} />
        <MobileMeta label={t("queue.assign")} value={ticket.assignedTo?.name || t("common.unassigned")} />
        <MobileMeta label={t("queue.due")} value={<DueLabel ticket={ticket} />} />
        <MobileMeta label={t("queue.priority")} value={getPriorityLabel(ticket.priority, t)} />
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {canViewTicket ? t("common.view") : getRequesterQueueText(t).summaryOnly}
        </p>
        <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
          <QueueActionMenu
            canDelete={canManageTickets}
            canOpenDetails={canViewTicket}
            deleting={isDeleting}
            disabled={isBusy}
            open={openActionTicketId === ticketId}
            onDelete={() => deleteTicket(ticketId)}
            onOpenDrawer={() => onOpenDrawer(ticket)}
            onToggle={() =>
              setOpenActionTicketId(openActionTicketId === ticketId ? null : ticketId)
            }
            onViewFullDetail={() => onViewTicket(ticketId)}
            t={t}
          />
        </div>
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

function QueueEmptyState({ activeQueue, groupAdminText, requesterText, staffQueueText, t }) {
  const message = requesterText
    ? getRequesterEmptyQueueMessage(activeQueue, requesterText)
    : groupAdminText
      ? getGroupAdminEmptyQueueMessage(activeQueue, groupAdminText)
      : staffQueueText
        ? getStaffEmptyQueueMessage(activeQueue, staffQueueText, t)
      : getEmptyQueueMessage(activeQueue, t);

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-blue-600 shadow-sm dark:bg-slate-950 dark:text-blue-300">
        0
      </div>
      <p className="mt-3 font-bold text-slate-800 dark:text-slate-100">{message.title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
        {message.description}
      </p>
    </div>
  );
}

function StaffQueueKpis({ kpis, text }) {
  const items = [
    { label: text.kpis.primary, value: kpis.primary, tone: kpis.primary ? "text-blue-700 dark:text-blue-200" : "" },
    { label: text.kpis.overdue, value: kpis.overdue, tone: kpis.overdue ? "text-rose-700 dark:text-rose-200" : "" },
    { label: text.kpis.dueSoon, value: kpis.dueSoon, tone: kpis.dueSoon ? "text-amber-700 dark:text-amber-200" : "" },
    { label: text.kpis.waitingRequester, value: kpis.waitingRequester, tone: kpis.waitingRequester ? "text-slate-700 dark:text-slate-200" : "" },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className={`text-2xl font-black text-slate-950 dark:text-white ${item.tone}`}>
            {item.value.toLocaleString()}
          </p>
          <p className="mt-1 break-words text-xs font-bold text-slate-500 dark:text-slate-400">
            {item.label}
          </p>
        </div>
      ))}
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

function PaginationControls({ currentPage, setCurrentPage, totalPages, t }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
      >
        {t("queue.previous")}
      </button>

      <span className="text-sm text-slate-500 dark:text-slate-400">
        {t("queue.page", { current: currentPage, total: totalPages })}
      </span>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
      >
        {t("queue.next")}
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

function buildQueueOptions(tickets, currentUserId, t, workQueueProfile) {
  const count = (queueId) =>
    tickets.filter((ticket) => matchesQueue(ticket, queueId, currentUserId, workQueueProfile)).length;

  if (workQueueProfile === "requester") {
    const requesterText = getRequesterQueueText(t);
    return [
      { id: "mine", label: requesterText.tabs.mine, count: count("mine"), activeClass: "border-blue-600 bg-blue-600 text-white" },
      { id: "department", label: requesterText.tabs.department, count: count("department"), activeClass: "border-sky-600 bg-sky-600 text-white" },
      { id: "feedback", label: requesterText.tabs.feedback, count: count("feedback"), activeClass: "border-amber-500 bg-amber-500 text-white" },
      { id: "all", label: requesterText.tabs.all, count: count("all"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    ];
  }

  if (workQueueProfile === "groupAdmin") {
    const text = getGroupAdminQueueText(t);
    return [
      { id: "now", label: text.tabs.now, count: count("now"), activeClass: "border-blue-600 bg-blue-600 text-white" },
      { id: "overdue", label: text.tabs.overdue, count: count("overdue"), activeClass: "border-rose-600 bg-rose-600 text-white" },
      { id: "urgent", label: text.tabs.urgent, count: count("urgent"), activeClass: "border-amber-500 bg-amber-500 text-white" },
      { id: "unassigned", label: text.tabs.unassigned, count: count("unassigned"), activeClass: "border-sky-600 bg-sky-600 text-white" },
      { id: "waitingRequester", label: text.tabs.waitingRequester, count: count("waitingRequester"), activeClass: "border-slate-700 bg-slate-700 text-white" },
      { id: "all", label: text.tabs.all, count: count("all"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    ];
  }

  if (workQueueProfile === "agent") {
    const text = getStaffQueueText(t, workQueueProfile);
    return [
      { id: "assignedToMe", label: text.tabs.assignedToMe, count: count("assignedToMe"), activeClass: "border-blue-600 bg-blue-600 text-white" },
      { id: "dueSoon", label: text.tabs.dueSoon, count: count("dueSoon"), activeClass: "border-amber-500 bg-amber-500 text-white" },
      { id: "waitingRequester", label: text.tabs.waitingRequester, count: count("waitingRequester"), activeClass: "border-slate-700 bg-slate-700 text-white" },
      { id: "all", label: text.tabs.all, count: count("all"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    ];
  }

  if (workQueueProfile === "manager") {
    const text = getStaffQueueText(t, workQueueProfile);
    return [
      { id: "now", label: text.tabs.now, count: count("now"), activeClass: "border-blue-600 bg-blue-600 text-white" },
      { id: "unassigned", label: text.tabs.unassigned, count: count("unassigned"), activeClass: "border-sky-600 bg-sky-600 text-white" },
      { id: "assignedToTeam", label: text.tabs.assignedToTeam, count: count("assignedToTeam"), activeClass: "border-indigo-600 bg-indigo-600 text-white" },
      { id: "dueSoon", label: text.tabs.dueSoon, count: count("dueSoon"), activeClass: "border-amber-500 bg-amber-500 text-white" },
      { id: "all", label: text.tabs.all, count: count("all"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    ];
  }

  return [
    { id: "now", label: t("queue.tabs.now"), count: count("now"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    { id: "overdue", label: t("queue.tabs.overdue"), count: count("overdue"), activeClass: "border-rose-600 bg-rose-600 text-white" },
    { id: "dueSoon", label: t("queue.tabs.dueSoon"), count: count("dueSoon"), activeClass: "border-amber-500 bg-amber-500 text-white" },
    { id: "unassigned", label: t("queue.tabs.unassigned"), count: count("unassigned"), activeClass: "border-sky-600 bg-sky-600 text-white" },
    { id: "assignedToMe", label: t("queue.tabs.assignedToMe"), count: count("assignedToMe"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    { id: "waitingRequester", label: t("queue.tabs.waitingRequester"), count: count("waitingRequester"), activeClass: "border-slate-700 bg-slate-700 text-white" },
    { id: "all", label: t("queue.tabs.all"), count: count("all"), activeClass: "border-blue-600 bg-blue-600 text-white" },
  ];
}

function matchesQueue(ticket, queueId, currentUserId, workQueueProfile = "staff") {
  if (workQueueProfile === "requester") {
    if (queueId === "department") return !canViewTicketDetails(ticket, currentUserId) && !isCompleted(ticket);
    if (queueId === "feedback") return canViewTicketDetails(ticket, currentUserId) && isWaitingRequester(ticket);
    if (queueId === "all") return true;
    return canViewTicketDetails(ticket, currentUserId);
  }

  if (workQueueProfile === "groupAdmin") {
    if (queueId === "all") return true;
    if (queueId === "overdue") return isOverdue(ticket);
    if (queueId === "urgent") return !isCompleted(ticket) && ["critical", "high"].includes(ticket.priority);
    if (queueId === "unassigned") return !isCompleted(ticket) && !ticket.assignedTo;
    if (queueId === "waitingRequester") return isWaitingRequester(ticket);
    return isGroupAdminRiskTicket(ticket);
  }

  if (workQueueProfile === "agent") {
    const assignedToMe = getEntityId(ticket.assignedTo) === currentUserId;
    if (queueId === "all") return true;
    if (queueId === "dueSoon") return assignedToMe && (isDueSoon(ticket) || isOverdue(ticket));
    if (queueId === "waitingRequester") return assignedToMe && isWaitingRequester(ticket);
    return !isCompleted(ticket) && assignedToMe;
  }

  if (workQueueProfile === "manager") {
    if (queueId === "all") return true;
    if (queueId === "unassigned") return !isCompleted(ticket) && !ticket.assignedTo;
    if (queueId === "assignedToTeam") return !isCompleted(ticket) && Boolean(ticket.assignedTo);
    if (queueId === "dueSoon") return isDueSoon(ticket) || isOverdue(ticket);
    return (
      isOverdue(ticket) ||
      isDueSoon(ticket) ||
      (!isCompleted(ticket) && !ticket.assignedTo) ||
      (!isCompleted(ticket) && ["critical", "high"].includes(ticket.priority))
    );
  }

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

function buildStaffQueueKpis(tickets, currentUserId, workQueueProfile) {
  if (workQueueProfile === "agent") {
    const assignedTickets = tickets.filter((ticket) => getEntityId(ticket.assignedTo) === currentUserId);
    return {
      primary: assignedTickets.filter((ticket) => !isCompleted(ticket)).length,
      overdue: assignedTickets.filter(isOverdue).length,
      dueSoon: assignedTickets.filter(isDueSoon).length,
      waitingRequester: assignedTickets.filter(isWaitingRequester).length,
    };
  }

  if (workQueueProfile === "manager") {
    return {
      primary: tickets.filter(
        (ticket) =>
          !isCompleted(ticket) &&
          (!ticket.assignedTo || ["critical", "high"].includes(ticket.priority) || isOverdue(ticket) || isDueSoon(ticket)),
      ).length,
      overdue: tickets.filter(isOverdue).length,
      dueSoon: tickets.filter(isDueSoon).length,
      waitingRequester: tickets.filter(isWaitingRequester).length,
    };
  }

  return {
    primary: tickets.filter(isGroupAdminRiskTicket).length,
    overdue: tickets.filter(isOverdue).length,
    dueSoon: tickets.filter(isDueSoon).length,
    waitingRequester: tickets.filter(isWaitingRequester).length,
  };
}

function getStaffEmptyQueueMessage(activeQueue, staffQueueText, t) {
  return staffQueueText.empty[activeQueue] || staffQueueText.empty.all || getEmptyQueueMessage(activeQueue, t);
}

function getStaffQueueText(t, workQueueProfile) {
  if (workQueueProfile === "agent") {
    return {
      description: pickText(t, "agentQueue.description", "Focus on tickets assigned to you and keep requesters updated."),
      heading: pickText(t, "agentQueue.heading", "My assigned work"),
      kpis: {
        primary: pickText(t, "agentQueue.kpis.primary", "Assigned active"),
        overdue: pickText(t, "agentQueue.kpis.overdue", "Overdue"),
        dueSoon: pickText(t, "agentQueue.kpis.dueSoon", "Due soon"),
        waitingRequester: pickText(t, "agentQueue.kpis.waitingRequester", "Waiting requester"),
      },
      tabs: {
        assignedToMe: pickText(t, "agentQueue.tabs.assignedToMe", "My assigned"),
        dueSoon: pickText(t, "agentQueue.tabs.dueSoon", "Due soon"),
        waitingRequester: pickText(t, "agentQueue.tabs.waitingRequester", "Waiting requester"),
        all: pickText(t, "agentQueue.tabs.all", "All visible"),
      },
      empty: {
        assignedToMe: {
          title: pickText(t, "agentQueue.empty.assignedToMeTitle", "No assigned work right now"),
          description: pickText(t, "agentQueue.empty.assignedToMeDescription", "New assigned tickets will appear here first."),
        },
        dueSoon: {
          title: pickText(t, "agentQueue.empty.dueSoonTitle", "Nothing due soon"),
          description: pickText(t, "agentQueue.empty.dueSoonDescription", "Assigned work is clear for the next few hours."),
        },
        waitingRequester: {
          title: pickText(t, "agentQueue.empty.waitingRequesterTitle", "No tickets waiting for requester"),
          description: pickText(t, "agentQueue.empty.waitingRequesterDescription", "Resolved assigned work waiting for feedback will appear here."),
        },
        all: {
          title: pickText(t, "agentQueue.empty.allTitle", "No visible tickets"),
          description: pickText(t, "agentQueue.empty.allDescription", "Tickets assigned to you or visible through your team will appear here."),
        },
      },
    };
  }

  if (workQueueProfile === "manager") {
    return {
      description: pickText(t, "managerQueue.description", "Triage team workload, assign owners, and keep due work moving."),
      heading: pickText(t, "managerQueue.heading", "Team triage queue"),
      kpis: {
        primary: pickText(t, "managerQueue.kpis.primary", "Needs triage"),
        overdue: pickText(t, "managerQueue.kpis.overdue", "Overdue"),
        dueSoon: pickText(t, "managerQueue.kpis.dueSoon", "Due soon"),
        waitingRequester: pickText(t, "managerQueue.kpis.waitingRequester", "Waiting requester"),
      },
      tabs: {
        now: pickText(t, "managerQueue.tabs.now", "Needs attention"),
        unassigned: pickText(t, "managerQueue.tabs.unassigned", "Unassigned"),
        assignedToTeam: pickText(t, "managerQueue.tabs.assignedToTeam", "Assigned to team"),
        dueSoon: pickText(t, "managerQueue.tabs.dueSoon", "Due soon"),
        all: pickText(t, "managerQueue.tabs.all", "All"),
      },
      empty: {
        now: {
          title: pickText(t, "managerQueue.empty.nowTitle", "No work needs triage right now"),
          description: pickText(t, "managerQueue.empty.nowDescription", "The team queue is stable. Review All for routine follow-up."),
        },
        unassigned: {
          title: pickText(t, "managerQueue.empty.unassignedTitle", "No unassigned work"),
          description: pickText(t, "managerQueue.empty.unassignedDescription", "New tickets already have an owner."),
        },
        assignedToTeam: {
          title: pickText(t, "managerQueue.empty.assignedToTeamTitle", "No active assigned work"),
          description: pickText(t, "managerQueue.empty.assignedToTeamDescription", "Assigned active tickets will appear here."),
        },
        dueSoon: {
          title: pickText(t, "managerQueue.empty.dueSoonTitle", "No due-soon work"),
          description: pickText(t, "managerQueue.empty.dueSoonDescription", "There are no tickets close to their due time."),
        },
        all: {
          title: pickText(t, "managerQueue.empty.allTitle", "No tickets in this queue"),
          description: pickText(t, "managerQueue.empty.allDescription", "Clear filters or switch hotel scope to review more work."),
        },
      },
    };
  }

  return {
    description: t("queue.description"),
    heading: t("queue.heading"),
    kpis: {
      primary: t("queue.tabs.now"),
      overdue: t("queue.tabs.overdue"),
      dueSoon: t("queue.tabs.dueSoon"),
      waitingRequester: t("queue.tabs.waitingRequester"),
    },
    tabs: {},
    empty: {},
  };
}

function getGroupAdminQueueText(t) {
  return {
    allOwners: pickText(t, "groupAdminQueue.filters.allOwners", "ทุกผู้รับผิดชอบ"),
    allPriorities: pickText(t, "groupAdminQueue.filters.allPriorities", "ทุกความเร่งด่วน"),
    description: pickText(t, "groupAdminQueue.description", "ควบคุมงานหลายโรงแรม จับงานเสี่ยง และจัดลำดับคิวได้เร็วขึ้น"),
    dueLabel: pickText(t, "groupAdminQueue.dueLabel", "กำหนด"),
    heading: pickText(t, "groupAdminQueue.heading", "คิวควบคุมหลายโรงแรม"),
    hotelColumn: pickText(t, "groupAdminQueue.columns.hotel", "โรงแรม / แผนก"),
    kpiDueSoon: pickText(t, "groupAdminQueue.kpis.dueSoon", "ใกล้ครบกำหนด"),
    kpiNow: pickText(t, "groupAdminQueue.kpis.now", "ต้องดูตอนนี้"),
    kpiOverdue: pickText(t, "groupAdminQueue.kpis.overdue", "เกินกำหนด"),
    kpiUnassignedUrgent: pickText(t, "groupAdminQueue.kpis.unassignedUrgent", "ด่วนยังไม่มอบหมาย"),
    ownerColumn: pickText(t, "groupAdminQueue.columns.owner", "ผู้รับผิดชอบ"),
    riskColumn: pickText(t, "groupAdminQueue.columns.risk", "ความเสี่ยง"),
    ticketColumn: pickText(t, "groupAdminQueue.columns.ticket", "Ticket"),
    unassignedOwner: pickText(t, "groupAdminQueue.filters.unassignedOwner", "ยังไม่มอบหมาย"),
    unknownHotel: pickText(t, "groupAdminQueue.unknownHotel", "ไม่ระบุโรงแรม"),
    empty: {
      all: {
        title: pickText(t, "groupAdminQueue.empty.allTitle", "ไม่พบ ticket ในคิวนี้"),
        description: pickText(t, "groupAdminQueue.empty.allDescription", "ลองล้าง filter หรือเลือกโรงแรมอื่นเพื่อตรวจสอบงานเพิ่มเติม"),
      },
      now: {
        title: pickText(t, "groupAdminQueue.empty.nowTitle", "ตอนนี้ไม่มีงานเสี่ยงที่ต้องรีบดู"),
        description: pickText(t, "groupAdminQueue.empty.nowDescription", "คิวควบคุมยังนิ่งอยู่ ลองดูทั้งหมดเพื่อ review งานทั่วไปได้"),
      },
      overdue: {
        title: pickText(t, "groupAdminQueue.empty.overdueTitle", "ไม่มีงานเกินกำหนด"),
        description: pickText(t, "groupAdminQueue.empty.overdueDescription", "สถานะดี ลองดูงานใกล้ครบกำหนดเพื่อป้องกันหลุด SLA"),
      },
      urgent: {
        title: pickText(t, "groupAdminQueue.empty.urgentTitle", "ไม่มีงานด่วนหรือวิกฤต"),
        description: pickText(t, "groupAdminQueue.empty.urgentDescription", "ยังไม่มี ticket high/critical ใน scope นี้"),
      },
      unassigned: {
        title: pickText(t, "groupAdminQueue.empty.unassignedTitle", "ไม่มีงานที่ยังไม่มอบหมาย"),
        description: pickText(t, "groupAdminQueue.empty.unassignedDescription", "งานใหม่ถูกมอบหมายเรียบร้อยแล้ว"),
      },
      waitingRequester: {
        title: pickText(t, "groupAdminQueue.empty.waitingRequesterTitle", "ไม่มีงานรอผู้แจ้ง"),
        description: pickText(t, "groupAdminQueue.empty.waitingRequesterDescription", "เมื่องานแก้เสร็จแต่ยังรอ feedback จะมาอยู่ตรงนี้"),
      },
    },
    risk: {
      dueSoon: pickText(t, "groupAdminQueue.risk.dueSoon", "ใกล้ครบกำหนด"),
      normal: pickText(t, "groupAdminQueue.risk.normal", "ปกติ"),
      overdue: pickText(t, "groupAdminQueue.risk.overdue", "เกินกำหนด"),
      unassigned: pickText(t, "groupAdminQueue.risk.unassigned", "ยังไม่มอบหมาย"),
      urgent: pickText(t, "groupAdminQueue.risk.urgent", "ด่วน/วิกฤต"),
      urgentUnassigned: pickText(t, "groupAdminQueue.risk.urgentUnassigned", "ด่วนยังไม่มอบหมาย"),
    },
    tabs: {
      all: pickText(t, "groupAdminQueue.tabs.all", "ทั้งหมด"),
      now: pickText(t, "groupAdminQueue.tabs.now", "ต้องดูตอนนี้"),
      overdue: pickText(t, "groupAdminQueue.tabs.overdue", "เกินกำหนด"),
      urgent: pickText(t, "groupAdminQueue.tabs.urgent", "ด่วน/วิกฤต"),
      unassigned: pickText(t, "groupAdminQueue.tabs.unassigned", "ยังไม่มอบหมาย"),
      waitingRequester: pickText(t, "groupAdminQueue.tabs.waitingRequester", "รอผู้แจ้ง"),
    },
  };
}

function getRequesterQueueText(t) {
  return {
    categoryLabel: pickText(t, "queue.requesterFields.category", "หมวด"),
    departmentSummary: pickText(t, "queue.badges.departmentSummary", "ดูเพื่อกันแจ้งซ้ำ"),
    departmentLabel: pickText(t, "queue.requesterFields.department", "แผนก"),
    description: pickText(t, "queue.requesterDescription", "ติดตามคำขอของคุณ และเช็กเรื่องในแผนกก่อนแจ้งซ้ำ"),
    feedbackBadge: pickText(t, "queue.badges.feedbackNeeded", "รอยืนยัน"),
    heading: pickText(t, "queue.requesterHeading", "คำขอของฉัน"),
    mineBadge: pickText(t, "queue.badges.mine", "ของฉัน"),
    ownTicketHelp: pickText(t, "queue.ownTicketHelp", "เปิดรายละเอียดเพื่อเพิ่มข้อมูลหรือยืนยันผลการแก้ไข"),
    statusLabel: pickText(t, "queue.requesterFields.status", "สถานะ"),
    summaryOnlyHelp: pickText(t, "queue.summaryOnlyHelp", "แสดงไว้เพื่อให้ทีมไม่ต้องแจ้งเรื่องเดียวกันซ้ำ"),
    summaryOnly: pickText(t, "queue.summaryOnly", "ดูสรุป"),
    updatedLabel: pickText(t, "queue.requesterFields.updated", "อัปเดต"),
    empty: {
      all: {
        title: pickText(t, "queue.userEmpty.allTitle", "ยังไม่มีรายการที่เกี่ยวข้อง"),
        description: pickText(t, "queue.userEmpty.allDescription", "ถ้าต้องการให้ IT ช่วย กดแจ้งปัญหาใหม่ได้เลย"),
      },
      department: {
        title: pickText(t, "queue.userEmpty.departmentTitle", "ยังไม่มีเรื่องในแผนก"),
        description: pickText(t, "queue.userEmpty.departmentDescription", "ตอนนี้ไม่มีเรื่องคล้ายกันที่เปิดอยู่ในแผนก"),
      },
      feedback: {
        title: pickText(t, "queue.userEmpty.feedbackTitle", "ยังไม่มีเรื่องที่รอคุณยืนยัน"),
        description: pickText(t, "queue.userEmpty.feedbackDescription", "เมื่อ IT แก้เสร็จ รายการจะมาอยู่ตรงนี้ให้ยืนยัน"),
      },
      mine: {
        title: pickText(t, "queue.userEmpty.mineTitle", "ตอนนี้ไม่มีเรื่องค้าง"),
        description: pickText(t, "queue.userEmpty.mineDescription", "ถ้ามีเรื่องให้ IT ช่วย กดแจ้งปัญหาใหม่ได้เลย"),
      },
    },
    tabs: {
      all: pickText(t, "queue.userTabs.all", "ทั้งหมดที่เกี่ยวข้อง"),
      department: pickText(t, "queue.userTabs.department", "ในแผนก"),
      feedback: pickText(t, "queue.userTabs.feedback", "รอ feedback"),
      mine: pickText(t, "queue.userTabs.mine", "ของฉัน"),
    },
  };
}

function pickText(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

export default TicketTable;
