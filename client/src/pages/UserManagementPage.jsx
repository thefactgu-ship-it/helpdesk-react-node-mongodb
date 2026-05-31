import UserManagement from "../components/UserManagement";

function UserManagementPage({
  currentUser,
  departments,
  deletingUserId,
  onCreateUser,
  onDeleteUser,
  onUpdateUser,
  savingUser,
  users,
  allHotels = [],
  hotels,
  selectedHotelId,
}) {
  return (
    <UserManagement
      currentUser={currentUser}
      departments={departments}
      deletingUserId={deletingUserId}
      onCreateUser={onCreateUser}
      onDeleteUser={onDeleteUser}
      onUpdateUser={onUpdateUser}
      savingUser={savingUser}
      users={users}
      allHotels={allHotels}
      hotels={hotels}
      selectedHotelId={selectedHotelId}
    />
  );
}

export default UserManagementPage;
