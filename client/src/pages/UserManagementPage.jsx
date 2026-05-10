import UserManagement from "../components/UserManagement";

function UserManagementPage({
  currentUser,
  deletingUserId,
  onCreateUser,
  onDeleteUser,
  onUpdateUser,
  savingUser,
  users,
}) {
  return (
    <UserManagement
      currentUser={currentUser}
      deletingUserId={deletingUserId}
      onCreateUser={onCreateUser}
      onDeleteUser={onDeleteUser}
      onUpdateUser={onUpdateUser}
      savingUser={savingUser}
      users={users}
    />
  );
}

export default UserManagementPage;
