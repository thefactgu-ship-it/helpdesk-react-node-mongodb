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
  filterPriority = "all",
  updatePriority,
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
  const canManageTickets = ["GroupAdmin", "Admin", "RegionalManager", "HotelAdmin", "Manager"].includes(currentUser?.role);
  const isGroupAdmin = currentUser?.role === "GroupAdmin";
  const isRequester = currentUser?.role === "User";
  const requesterText = getRequesterQueueText(t);
  const groupAdminText = getGroupAdminQueueText(t);
  const assignableUsers = users.filter((user) =>
    ["admin", "manager", "agent", "staff"].includes(
      String(user.role || "").toLowerCase(),
    ),
  );
  const currentUserId = getEntityId(currentUser);
  const queueOptions = useMemo(
    () => buildQueueOptions(tickets, currentUserId, t, isRequester, isGroupAdmin),
    [currentUserId, isGroupAdmin, isRequester, tickets, t],
  );
  const validQueueIds = useMemo(
    () => queueOptions.map((queue) => queue.id),
    [queueOptions],
  );
  const preferredQueue = isRequester ? "mine" : "now";
  const activeQueueId = validQueueIds.includes(activeQueue) ? activeQueue : preferredQueue;
  const queueTickets = useMemo(
    () => tickets.filter((ticket) => matchesQueue(ticket, activeQueueId, currentUserId, isRequester, isGroupAdmin)),
    [activeQueueId, currentUserId, isGroupAdmin, isRequester, tickets],
  );
  const displayTickets = useMemo(
    () =>
      isGroupAdmin
        ? queueTickets.filter((ticket) => matchesGroupAdminOwnerFilter(ticket, groupAdminOwnerFilter))
        : queueTickets,
    [groupAdminOwnerFilter, isGroupAdmin, queueTickets],
  );
  const totalPages = Math.max(1, Math.ceil(displayTickets.length / ticketsPerPage));
  const visibleTickets = displayTickets.slice(
    (currentPage - 1) * ticketsPerPage,
    currentPage * ticketsPerPage,
  );
  const statusOptions = buildStatusOptions(t);
  const priorityOptions = buildPriorityOptions(t);
  const groupAdminKpis = useMemo(() => buildGroupAdminQueueKpis(tickets), [tickets]);
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
    <section className="mt-6 min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
      <div className="mb-5 flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 lg:max-w-sm">
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {isGroupAdmin ? groupAdminText.heading : isRequester ? requesterText.heading : t("queue.heading")}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isGroupAdmin ? groupAdminText.description : isRequester ? requesterText.description : t("queue.description")}
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
          priorityOptions={priorityOptions}
          queueTickets={displayTickets}
          setCurrentPage={setCurrentPage}
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
                canViewTicket={canManageTickets || canViewTicketDetails(ticket, currentUserId)}
                deleteTicket={deleteTicket}
                isAssigning={isAssigning}
                isBusy={isBusy}
                isDeleting={isDeleting}
                onViewTicket={onViewTicket}
                priorityOptions={priorityOptions}
                statusOptions={statusOptions}
                t={t}
                ticket={ticket}
                updateStatus={updateStatus}
                updatePriority={updatePriority}
              />
            );
          })
        )}

        {!loading && queueTickets.length === 0 && (
          <QueueEmptyState activeQueue={activeQueueId} t={t} />
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

                return (
                  <tr
                    key={ticket._id}
                    className="border-b last:border-0 dark:border-slate-700"
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
                          <Badge text={getPriorityLabel(ticket.priority, t)} />
                        )}
                        {ticket.criticalRequested && (
                          <StatusPill label={t("queue.criticalReview")} tone="warning" />
                        )}
                      </div>
                    </td>
                    <td className="px-3">
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
                        <Badge text={getStatusLabel(ticket.status, t)} />
                      )}
                    </td>
                    <td className="px-3 text-slate-500 dark:text-slate-400">
                      {canManageTickets ? (
                        <ThemedSelect
                          className="w-40"
                          compactOptions
                          menuWidth={180}
                          size="sm"
                          value={ticket.assignedTo?._id || ""}
                          disabled={isBusy || !assignableUsers.length}
                          emptyLabel={isAssigning ? t("addTicket.assigning") : t("common.unassigned")}
                          onChange={(value) => assignTicket(ticket._id, value)}
                          options={[
                            { value: "", label: isAssigning ? t("addTicket.assigning") : t("common.unassigned"), prefix: "-" },
                            ...assignableUsers.map((user) => ({
                              value: user._id || user.id,
                              label: user.name,
                              meta: user.role,
                              prefix: getInitials(user.name),
                            })),
                          ]}
                        />
                      ) : (
                        ticket.assignedTo?.name || t("common.unassigned")
                      )}
                    </td>
                    <td className="px-3 text-slate-500 dark:text-slate-400">
                      <DueLabel ticket={ticket} />
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-3">
                      <button
                        type="button"
                        onClick={() => onViewTicket(ticket._id)}
                        disabled={!canOpenDetails}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {canOpenDetails ? t("common.view") : requesterText.summaryOnly}
                      </button>
                      {canManageTickets && (
                        <button
                          type="button"
                          onClick={() => deleteTicket(ticket._id)}
                          disabled={isBusy}
                          className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          {isDeleting ? t("common.deleting") : t("common.delete")}
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
                  <QueueEmptyState activeQueue={activeQueueId} t={t} />
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
    </section>
  );
}

function GroupAdminControlView({
  activeQueue,
  assignTicket,
  assignableUsers,
  assigningTicketId,
  currentPage,
  deleteTicket,
  deletingTicketId,
  loading,
  onViewTicket,
  priorityOptions,
  queueTickets,
  setCurrentPage,
  statusOptions,
  t,
  text,
  ticketsPerPage,
  updatePriority,
  updateStatus,
  updatingTicketId,
  visibleTickets,
}) {
  const totalPages = Math.max(1, Math.ceil(queueTickets.length / ticketsPerPage));

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (!queueTickets.length) {
    return <QueueEmptyState activeQueue={activeQueue} groupAdminText={text} t={t} />;
  }

  return (
    <>
      <div className="space-y-3 2xl:hidden">
        {visibleTickets.map((ticket) => (
          <GroupAdminMobileControlCard
            key={ticket._id || ticket.id}
            assignTicket={assignTicket}
            assignableUsers={assignableUsers}
            assigningTicketId={assigningTicketId}
            deleteTicket={deleteTicket}
            deletingTicketId={deletingTicketId}
            onViewTicket={onViewTicket}
            priorityOptions={priorityOptions}
            statusOptions={statusOptions}
            t={t}
            text={text}
            ticket={ticket}
            updatePriority={updatePriority}
            updateStatus={updateStatus}
            updatingTicketId={updatingTicketId}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto 2xl:block">
        <table className="min-w-[78rem] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="px-3 py-3 font-black">{text.ticketColumn}</th>
              <th className="px-3 font-black">{text.hotelColumn}</th>
              <th className="px-3 font-black">{text.riskColumn}</th>
              <th className="px-3 font-black">{t("queue.priority")}</th>
              <th className="px-3 font-black">{t("queue.statusLabel")}</th>
              <th className="px-3 font-black">{text.ownerColumn}</th>
              <th className="px-3 font-black">{t("queue.due")}</th>
              <th className="px-3 font-black">{t("queue.action")}</th>
            </tr>
          </thead>
          <tbody>
            {visibleTickets.map((ticket) => (
              <GroupAdminControlRow
                key={ticket._id || ticket.id}
                assignTicket={assignTicket}
                assignableUsers={assignableUsers}
                assigningTicketId={assigningTicketId}
                deleteTicket={deleteTicket}
                deletingTicketId={deletingTicketId}
                onViewTicket={onViewTicket}
                priorityOptions={priorityOptions}
                statusOptions={statusOptions}
                t={t}
                text={text}
                ticket={ticket}
                updatePriority={updatePriority}
                updateStatus={updateStatus}
                updatingTicketId={updatingTicketId}
              />
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        t={t}
        totalPages={totalPages}
      />
    </>
  );
}

function GroupAdminControlRow({
  assignTicket,
  assignableUsers,
  assigningTicketId,
  deleteTicket,
  deletingTicketId,
  onViewTicket,
  priorityOptions,
  statusOptions,
  t,
  text,
  ticket,
  updatePriority,
  updateStatus,
  updatingTicketId,
}) {
  const ticketId = ticket._id || ticket.id;
  const isUpdating = updatingTicketId === ticketId;
  const isAssigning = assigningTicketId === ticketId;
  const isDeleting = deletingTicketId === ticketId;
  const isBusy = isUpdating || isAssigning || isDeleting;

  return (
    <tr className="border-b border-slate-200 last:border-0 dark:border-slate-700">
      <td className="max-w-xs px-3 py-4">
        <p className="text-xs font-black text-blue-700 dark:text-blue-300">{ticket.ticketNumber}</p>
        <p className="mt-1 line-clamp-2 font-black text-slate-900 dark:text-white">{ticket.title}</p>
        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {ticket.category || "-"}
        </p>
      </td>
      <td className="min-w-44 px-3 text-xs text-slate-500 dark:text-slate-400">
        <p className="font-black text-slate-700 dark:text-slate-200">{getTicketHotelLabel(ticket, text.unknownHotel)}</p>
        <p className="mt-1">{ticket.departmentName || ticket.department || "-"}</p>
      </td>
      <td className="min-w-40 px-3">
        <div className="flex flex-wrap gap-2">
          {getGroupAdminRiskBadges(ticket, text, t).map((badge) => (
            <StatusPill key={badge.label} {...badge} />
          ))}
        </div>
      </td>
      <td className="px-3">
        <ThemedSelect
          className="w-32"
          compactOptions
          menuWidth={150}
          size="sm"
          value={ticket.priority}
          disabled={isBusy}
          onChange={(value) => updatePriority(ticketId, value)}
          options={priorityOptions}
        />
      </td>
      <td className="px-3">
        <ThemedSelect
          className="w-36"
          compactOptions
          menuWidth={160}
          size="sm"
          value={ticket.status}
          disabled={isBusy}
          onChange={(value) => updateStatus(ticketId, value)}
          options={statusOptions.filter((option) => option.value !== "all")}
        />
      </td>
      <td className="px-3">
        <ThemedSelect
          className="w-40"
          compactOptions
          menuWidth={180}
          size="sm"
          value={getEntityId(ticket.assignedTo)}
          disabled={isBusy || !assignableUsers.length}
          emptyLabel={isAssigning ? t("addTicket.assigning") : t("common.unassigned")}
          onChange={(value) => assignTicket(ticketId, value)}
          options={buildAssignableOptions(assignableUsers, isAssigning, t)}
        />
      </td>
      <td className="min-w-28 px-3 text-slate-500 dark:text-slate-400">
        <DueLabel ticket={ticket} />
      </td>
      <td className="space-x-2 whitespace-nowrap px-3">
        <button
          type="button"
          onClick={() => onViewTicket(ticketId)}
          className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {t("common.view")}
        </button>
        <button
          type="button"
          onClick={() => deleteTicket(ticketId)}
          disabled={isBusy}
          className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
        >
          {isDeleting ? t("common.deleting") : t("common.delete")}
        </button>
      </td>
    </tr>
  );
}

function GroupAdminMobileControlCard(props) {
  const {
    assignTicket,
    assignableUsers,
    assigningTicketId,
    deleteTicket,
    deletingTicketId,
    onViewTicket,
    priorityOptions,
    statusOptions,
    t,
    text,
    ticket,
    updatePriority,
    updateStatus,
    updatingTicketId,
  } = props;
  const ticketId = ticket._id || ticket.id;
  const isUpdating = updatingTicketId === ticketId;
  const isAssigning = assigningTicketId === ticketId;
  const isDeleting = deletingTicketId === ticketId;
  const isBusy = isUpdating || isAssigning || isDeleting;

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-blue-700 dark:text-blue-300">{ticket.ticketNumber}</p>
          <h4 className="mt-1 line-clamp-2 break-words text-base font-black text-slate-950 dark:text-white">
            {ticket.title}
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {getTicketHotelLabel(ticket, text.unknownHotel)} / {ticket.departmentName || ticket.department || "-"}
          </p>
        </div>
        <div className="flex max-w-full flex-wrap gap-2">
          {getGroupAdminRiskBadges(ticket, text, t).map((badge) => (
            <StatusPill key={badge.label} {...badge} />
          ))}
        </div>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
        <ThemedSelect
          compactOptions
          size="sm"
          value={ticket.priority}
          disabled={isBusy}
          onChange={(value) => updatePriority(ticketId, value)}
          options={priorityOptions}
        />
        <ThemedSelect
          compactOptions
          size="sm"
          value={ticket.status}
          disabled={isBusy}
          onChange={(value) => updateStatus(ticketId, value)}
          options={statusOptions.filter((option) => option.value !== "all")}
        />
        <ThemedSelect
          compactOptions
          size="sm"
          value={getEntityId(ticket.assignedTo)}
          disabled={isBusy || !assignableUsers.length}
          emptyLabel={isAssigning ? t("addTicket.assigning") : t("common.unassigned")}
          onChange={(value) => assignTicket(ticketId, value)}
          options={buildAssignableOptions(assignableUsers, isAssigning, t)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {text.dueLabel}: <DueLabel ticket={ticket} />
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onViewTicket(ticketId)}
            className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100"
          >
            {t("common.view")}
          </button>
          <button
            type="button"
            onClick={() => deleteTicket(ticketId)}
            disabled={isBusy}
            className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </button>
        </div>
      </div>
    </article>
  );
}

function GroupAdminQueueKpis({ kpis, text }) {
  const items = [
    { label: text.kpiNow, value: kpis.now, tone: kpis.now ? "text-blue-700 dark:text-blue-200" : "" },
    { label: text.kpiOverdue, value: kpis.overdue, tone: kpis.overdue ? "text-rose-700 dark:text-rose-200" : "" },
    { label: text.kpiUnassignedUrgent, value: kpis.unassignedUrgent, tone: kpis.unassignedUrgent ? "text-amber-700 dark:text-amber-200" : "" },
    { label: text.kpiDueSoon, value: kpis.dueSoon, tone: kpis.dueSoon ? "text-amber-700 dark:text-amber-200" : "" },
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

function RequesterQueueCards({
  activeQueue,
  currentPage,
  currentUserId,
  loading,
  onViewTicket,
  queueTickets,
  requesterText,
  setCurrentPage,
  t,
  ticketsPerPage,
  visibleTickets,
}) {
  const totalPages = Math.max(1, Math.ceil(queueTickets.length / ticketsPerPage));

  if (loading) {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        <MobileTicketSkeleton />
        <MobileTicketSkeleton />
        <MobileTicketSkeleton />
        <MobileTicketSkeleton />
      </div>
    );
  }

  if (!queueTickets.length) {
    return (
      <QueueEmptyState
        activeQueue={activeQueue}
        requesterText={requesterText}
        t={t}
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        {visibleTickets.map((ticket) => (
          <RequesterQueueCard
            key={ticket._id || ticket.id}
            canViewTicket={canViewTicketDetails(ticket, currentUserId)}
            onViewTicket={onViewTicket}
            requesterText={requesterText}
            t={t}
            ticket={ticket}
          />
        ))}
      </div>

      <PaginationControls
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        t={t}
        totalPages={totalPages}
      />
    </>
  );
}

function RequesterQueueCard({ canViewTicket, onViewTicket, requesterText, t, ticket }) {
  const summaryOnly = !canViewTicket;
  const statusLabel = getStatusLabel(ticket.status, t);
  const isActive = !isCompleted(ticket);
  const updatedLabel = ticket.updatedAt
    ? new Date(ticket.updatedAt).toLocaleDateString()
    : ticket.createdAt
      ? new Date(ticket.createdAt).toLocaleDateString()
      : "-";

  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-950 ${
        summaryOnly
          ? "border-sky-200 dark:border-sky-500/30"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-blue-600 dark:text-blue-300">
            {ticket.ticketNumber}
          </p>
          <h4 className="mt-1 line-clamp-2 break-words text-base font-black text-slate-950 dark:text-white">
            {ticket.title}
          </h4>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
            isActive
              ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20"
              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/20"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {summaryOnly ? (
          <StatusPill label={requesterText.departmentSummary} tone="neutral" />
        ) : (
          <StatusPill label={requesterText.mineBadge} tone="info" />
        )}
        {isWaitingRequester(ticket) && (
          <StatusPill label={requesterText.feedbackBadge} tone="warning" />
        )}
        {ticket.criticalRequested && (
          <StatusPill label={t("queue.criticalReview")} tone="warning" />
        )}
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <RequesterMeta label={requesterText.categoryLabel} value={ticket.category || "-"} />
        <RequesterMeta label={requesterText.departmentLabel} value={ticket.departmentName || ticket.department || "-"} />
        <RequesterMeta label={requesterText.statusLabel} value={statusLabel} />
        <RequesterMeta label={requesterText.updatedLabel} value={updatedLabel} />
      </dl>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          {summaryOnly ? requesterText.summaryOnlyHelp : requesterText.ownTicketHelp}
        </p>
        {canViewTicket ? (
          <button
            type="button"
            onClick={() => onViewTicket(ticket._id)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-700"
          >
            {t("common.view")}
          </button>
        ) : (
          <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 px-4 py-2 text-xs font-black text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            {requesterText.summaryOnly}
          </span>
        )}
      </div>
    </article>
  );
}

function RequesterMeta({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
      <dt className="text-[11px] font-bold text-slate-400">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}

function TicketMobileCard({
  assignTicket,
  assignableUsers,
  canManageTickets,
  canUpdateStatus,
  canViewTicket,
  deleteTicket,
  isAssigning,
  isBusy,
  isDeleting,
  onViewTicket,
  priorityOptions,
  statusOptions,
  t,
  ticket,
  updateStatus,
  updatePriority,
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
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
        <div className="flex w-32 shrink-0 flex-col items-end gap-2">
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
            <Badge text={getPriorityLabel(ticket.priority, t)} />
          )}
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

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MobileMeta label={t("queue.due")} value={<DueLabel ticket={ticket} />} />
        <MobileMeta label={t("queue.assign")} value={ticket.assignedTo?.name || t("common.unassigned")} />
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
          <Badge text={getStatusLabel(ticket.status, t)} />
        )}

        {canManageTickets && (
          <ThemedSelect
            compactOptions
            size="sm"
            value={ticket.assignedTo?._id || ""}
            disabled={isBusy || !assignableUsers.length}
            emptyLabel={isAssigning ? t("addTicket.assigning") : t("common.unassigned")}
            onChange={(value) => assignTicket(ticket._id, value)}
            options={[
              { value: "", label: isAssigning ? t("addTicket.assigning") : t("common.unassigned"), prefix: "-" },
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
          disabled={!canViewTicket}
          className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          {canViewTicket ? t("common.view") : getRequesterQueueText(t).summaryOnly}
        </button>
        {canManageTickets && (
          <button
            type="button"
            onClick={() => deleteTicket(ticket._id)}
            disabled={isBusy}
            className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
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

function QueueEmptyState({ activeQueue, groupAdminText, requesterText, t }) {
  const message = requesterText
    ? getRequesterEmptyQueueMessage(activeQueue, requesterText)
    : groupAdminText
      ? getGroupAdminEmptyQueueMessage(activeQueue, groupAdminText)
      : getEmptyQueueMessage(activeQueue, t);

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

function StatusPill({ label, tone = "info" }) {
  const className = {
    danger: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/20",
    warning: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20",
    info: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/20",
    neutral: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  }[tone];

  return (
    <span className={`inline-flex max-w-full shrink-0 items-center break-words rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${className}`}>
      {label}
    </span>
  );
}

function buildQueueOptions(tickets, currentUserId, t, isRequester, isGroupAdmin = false) {
  const count = (queueId) =>
    tickets.filter((ticket) => matchesQueue(ticket, queueId, currentUserId, isRequester, isGroupAdmin)).length;

  if (isRequester) {
    const requesterText = getRequesterQueueText(t);
    return [
      { id: "mine", label: requesterText.tabs.mine, count: count("mine"), activeClass: "border-blue-600 bg-blue-600 text-white" },
      { id: "department", label: requesterText.tabs.department, count: count("department"), activeClass: "border-sky-600 bg-sky-600 text-white" },
      { id: "feedback", label: requesterText.tabs.feedback, count: count("feedback"), activeClass: "border-amber-500 bg-amber-500 text-white" },
      { id: "all", label: requesterText.tabs.all, count: count("all"), activeClass: "border-blue-600 bg-blue-600 text-white" },
    ];
  }

  if (isGroupAdmin) {
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

function matchesQueue(ticket, queueId, currentUserId, isRequester = false, isGroupAdmin = false) {
  if (isRequester) {
    if (queueId === "department") return !canViewTicketDetails(ticket, currentUserId) && !isCompleted(ticket);
    if (queueId === "feedback") return canViewTicketDetails(ticket, currentUserId) && isWaitingRequester(ticket);
    if (queueId === "all") return true;
    return canViewTicketDetails(ticket, currentUserId);
  }

  if (isGroupAdmin) {
    if (queueId === "all") return true;
    if (queueId === "overdue") return isOverdue(ticket);
    if (queueId === "urgent") return !isCompleted(ticket) && ["critical", "high"].includes(ticket.priority);
    if (queueId === "unassigned") return !isCompleted(ticket) && !ticket.assignedTo;
    if (queueId === "waitingRequester") return isWaitingRequester(ticket);
    return isGroupAdminRiskTicket(ticket);
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

function getQueueBadges(ticket, t) {
  const badges = [];
  if (isOverdue(ticket)) badges.push({ label: t("queue.badges.overdue"), tone: "danger" });
  else if (isDueSoon(ticket)) badges.push({ label: t("queue.badges.dueSoon"), tone: "warning" });
  if (!isCompleted(ticket) && !ticket.assignedTo) badges.push({ label: t("queue.badges.unassigned"), tone: "info" });
  if (isWaitingRequester(ticket)) badges.push({ label: t("queue.badges.waitingRequester"), tone: "neutral" });
  return badges;
}

function getGroupAdminRiskBadges(ticket, text, t) {
  const badges = [];
  if (isOverdue(ticket)) badges.push({ label: text.risk.overdue, tone: "danger" });
  else if (isDueSoon(ticket)) badges.push({ label: text.risk.dueSoon, tone: "warning" });
  if (!isCompleted(ticket) && !ticket.assignedTo && ["critical", "high"].includes(ticket.priority)) {
    badges.push({ label: text.risk.urgentUnassigned, tone: "warning" });
  } else if (!isCompleted(ticket) && !ticket.assignedTo) {
    badges.push({ label: text.risk.unassigned, tone: "info" });
  }
  if (!isCompleted(ticket) && ["critical", "high"].includes(ticket.priority)) {
    badges.push({ label: text.risk.urgent, tone: "warning" });
  }
  if (isWaitingRequester(ticket)) badges.push({ label: t("queue.badges.waitingRequester"), tone: "neutral" });
  if (ticket.criticalRequested) badges.push({ label: t("queue.criticalReview"), tone: "warning" });
  if (!badges.length) badges.push({ label: text.risk.normal, tone: "neutral" });
  return badges;
}

function buildGroupAdminQueueKpis(tickets) {
  return {
    dueSoon: tickets.filter(isDueSoon).length,
    now: tickets.filter(isGroupAdminRiskTicket).length,
    overdue: tickets.filter(isOverdue).length,
    unassignedUrgent: tickets.filter(
      (ticket) => !isCompleted(ticket) && !ticket.assignedTo && ["critical", "high"].includes(ticket.priority),
    ).length,
  };
}

function isGroupAdminRiskTicket(ticket) {
  return (
    isOverdue(ticket) ||
    isDueSoon(ticket) ||
    (!isCompleted(ticket) && !ticket.assignedTo && ["critical", "high"].includes(ticket.priority)) ||
    (!isCompleted(ticket) && ticket.priority === "critical")
  );
}

function matchesGroupAdminOwnerFilter(ticket, ownerFilter) {
  if (!ownerFilter || ownerFilter === "all") return true;
  if (ownerFilter === "unassigned") return !ticket.assignedTo;
  return getEntityId(ticket.assignedTo) === ownerFilter;
}

function buildGroupAdminOwnerOptions(tickets, users, text) {
  const ownerIds = new Set(
    tickets.map((ticket) => getEntityId(ticket.assignedTo)).filter(Boolean),
  );
  const owners = users
    .filter((user) => ownerIds.has(getEntityId(user)))
    .map((user) => ({
      value: getEntityId(user),
      label: user.name || user.email || getEntityId(user),
      meta: user.role,
      prefix: getInitials(user.name || user.email),
    }));

  return [
    { value: "all", label: text.allOwners, prefix: "A" },
    { value: "unassigned", label: text.unassignedOwner, prefix: "-" },
    ...owners,
  ];
}

function buildAssignableOptions(assignableUsers, isAssigning, t) {
  return [
    { value: "", label: isAssigning ? t("addTicket.assigning") : t("common.unassigned"), prefix: "-" },
    ...assignableUsers.map((user) => ({
      value: user._id || user.id,
      label: user.name,
      meta: user.role,
      prefix: getInitials(user.name),
    })),
  ];
}

function getEmptyQueueMessage(activeQueue, t) {
  const keys = {
    now: ["nowTitle", "nowDescription"],
    overdue: ["overdueTitle", "overdueDescription"],
    dueSoon: ["dueSoonTitle", "dueSoonDescription"],
    unassigned: ["unassignedTitle", "unassignedDescription"],
    assignedToMe: ["assignedToMeTitle", "assignedToMeDescription"],
    waitingRequester: ["waitingRequesterTitle", "waitingRequesterDescription"],
    all: ["allTitle", "allDescription"],
  }[activeQueue] || ["allTitle", "allDescription"];

  return {
    title: t(`queue.empty.${keys[0]}`),
    description: t(`queue.empty.${keys[1]}`),
  };
}

function buildStatusOptions(t) {
  return [
    { value: "all", label: t("queue.status.all"), prefix: "A" },
    { value: "open", label: t("queue.status.open"), prefix: "O" },
    { value: "in_progress", label: t("queue.status.in_progress"), prefix: "IP" },
    { value: "resolved", label: t("queue.status.resolved"), prefix: "R" },
    { value: "closed", label: t("queue.status.closed"), prefix: "C" },
  ];
}

function buildPriorityOptions(t) {
  return [
    { value: "low", label: t("addTicket.priorities.low"), prefix: "L" },
    { value: "medium", label: t("addTicket.priorities.medium"), prefix: "M" },
    { value: "high", label: t("addTicket.priorities.high"), prefix: "H" },
    { value: "critical", label: t("addTicket.priorities.critical"), prefix: "C" },
  ];
}

function getStatusLabel(status, t) {
  return t(`queue.status.${status}`) || status;
}

function getPriorityLabel(priority, t) {
  return t(`addTicket.priorities.${priority}`) || priority;
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

function getTicketHotelLabel(ticket, fallback) {
  const hotel = ticket?.hotelId;
  if (!hotel) return fallback;
  if (typeof hotel === "string") return hotel;
  return [hotel.code, hotel.name].filter(Boolean).join(" / ") || getEntityId(hotel) || fallback;
}

function getRequesterEmptyQueueMessage(activeQueue, requesterText) {
  return requesterText.empty[activeQueue] || requesterText.empty.all;
}

function getGroupAdminEmptyQueueMessage(activeQueue, groupAdminText) {
  return groupAdminText.empty[activeQueue] || groupAdminText.empty.all;
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

function canViewTicketDetails(ticket, currentUserId) {
  if (ticket.requesterScope === "department") return false;
  return (
    getEntityId(ticket.createdBy) === currentUserId ||
    getEntityId(ticket.requesterUserId) === currentUserId ||
    getEntityId(ticket.assignedTo) === currentUserId
  );
}

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
