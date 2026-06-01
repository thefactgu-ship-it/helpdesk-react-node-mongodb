import { lazyWithDeployRetry } from "../utils/lazyWithDeployRetry";

const AddTicketPage = lazyWithDeployRetry(() => import("../pages/AddTicketPage"));
const AssetManagementPage = lazyWithDeployRetry(() => import("../pages/AssetManagementPage"));
const AuditLogsPage = lazyWithDeployRetry(() => import("../pages/AuditLogsPage"));
const DashboardPage = lazyWithDeployRetry(() => import("../pages/DashboardPage"));
const DepartmentManagementPage = lazyWithDeployRetry(() => import("../pages/DepartmentManagementPage"));
const HotelManagementPage = lazyWithDeployRetry(() => import("../pages/HotelManagementPage"));
const MonthlyReportPage = lazyWithDeployRetry(() => import("../pages/MonthlyReportPage"));
const ProblemTypesPage = lazyWithDeployRetry(() => import("../pages/ProblemTypesPage"));
const ProfilePage = lazyWithDeployRetry(() => import("../pages/ProfilePage"));
const WeeklyReportPage = lazyWithDeployRetry(() => import("../pages/WeeklyReportPage"));
const QuarterlyYearlyPage = lazyWithDeployRetry(() => import("../pages/QuarterlyYearlyPage"));
const TicketsPage = lazyWithDeployRetry(() => import("../pages/TicketsPage"));
const UserManagementPage = lazyWithDeployRetry(() => import("../pages/UserManagementPage"));

function PageRouter({
  addTicketComment,
  assignTicket,
  assigningTicketId,
  canAssignTickets,
  canManageDepartments,
  canManageHotelSettings,
  canManageUsers,
  changeMyPassword,
  claimTicket,
  currentPage,
  currentUser,
  darkMode,
  deleteTicket,
  deletingTicketId,
  deletingUserId,
  departments,
  fetchDepartments,
  fetchHotels,
  filteredTickets,
  filterPriority,
  filterStatus,
  form,
  handleFilterPriorityChange,
  handleFilterStatusChange,
  handleSearchChange,
  handleSelectedHotelChange,
  handleSubmit,
  allHotels = [],
  hotels,
  loading,
  openTicketDetails,
  profileInitialSection,
  reopenTicket,
  savingProfile,
  savingUser,
  search,
  selectedHotelId,
  setActivePage,
  setCurrentPage,
  setForm,
  submitting,
  summaryTickets,
  t,
  ticketsPerPage,
  token,
  updateUser,
  updateMyProfile,
  updateTicketDueDate,
  updateTicketPriority,
  updateStatus,
  updatingTicketId,
  users,
  visibleActivePage,
  changingPassword,
  createUser,
  deleteUser,
}) {
  return (
    <>
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
        <MonthlyReportPage hotels={hotels} selectedHotelId={selectedHotelId} t={t} tickets={summaryTickets} />
      )}

      {visibleActivePage === "weekly-report" && (
        <WeeklyReportPage hotels={hotels} selectedHotelId={selectedHotelId} t={t} tickets={summaryTickets} />
      )}

      {visibleActivePage === "quarterly-report" && (
        <QuarterlyYearlyPage hotels={hotels} selectedHotelId={selectedHotelId} t={t} tickets={summaryTickets} />
      )}

      {visibleActivePage === "assets" && (
        <AssetManagementPage currentUser={currentUser} hotelId={selectedHotelId} t={t} token={token} />
      )}

      {visibleActivePage === "audit-logs" && canManageHotelSettings && (
        <AuditLogsPage hotels={hotels} selectedHotelId={selectedHotelId} token={token} />
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
          currentUser={currentUser}
          hotels={allHotels}
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
          allHotels={allHotels}
          hotels={hotels}
          selectedHotelId={selectedHotelId}
        />
      )}

      {visibleActivePage === "problem-types" && (
        <ProblemTypesPage currentUser={currentUser} hotelId={selectedHotelId} token={token} />
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
    </>
  );
}

export default PageRouter;
