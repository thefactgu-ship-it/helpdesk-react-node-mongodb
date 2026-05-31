import { useCallback, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { canManageTickets } from "../config/rolePolicy";
import { API_BASE_URL } from "../services/api";
import { getErrorMessage } from "../utils/entityHelpers";

const AUTH_URL = `${API_BASE_URL}/auth`;

export function useUserActions({
  authHeaders,
  currentUser,
  scopedParams,
  selectedHotelId,
  setCurrentUser,
  token,
}) {
  const [users, setUsers] = useState([]);
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!token || !canManageTickets(currentUser?.role)) {
      setUsers([]);
      return;
    }

    try {
      const res = await axios.get(`${AUTH_URL}/users`, {
        headers: authHeaders,
        params: scopedParams,
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  }, [authHeaders, currentUser?.role, scopedParams, token]);

  const createUser = async (userForm) => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error("Name, email, and password are required");
      return false;
    }

    try {
      setSavingUser(true);
      await axios.post(
        `${AUTH_URL}/users`,
        {
          ...userForm,
          hotelId: userForm.hotelId || (selectedHotelId !== "all" ? selectedHotelId : undefined),
        },
        {
          headers: authHeaders,
          params: scopedParams,
        },
      );
      toast.success("User created");
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Failed to create user", error);
      toast.error(getErrorMessage(error, "Failed to create user"));
      return false;
    } finally {
      setSavingUser(false);
    }
  };

  const updateUser = async (id, userForm) => {
    if (!userForm.name || !userForm.email) {
      toast.error("Name and email are required");
      return false;
    }

    try {
      setSavingUser(true);
      const res = await axios.patch(`${AUTH_URL}/users/${id}`, userForm, {
        headers: authHeaders,
        params: scopedParams,
      });

      if (currentUser && (currentUser.id === id || currentUser._id === id)) {
        setCurrentUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      }

      toast.success("User updated");
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Failed to update user", error);
      toast.error(getErrorMessage(error, "Failed to update user"));
      return false;
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = (id) => {
    setDeleteUserId(id);
  };

  const confirmDeleteUser = async () => {
    try {
      setDeletingUserId(deleteUserId);
      await axios.delete(`${AUTH_URL}/users/${deleteUserId}`, {
        headers: authHeaders,
        params: scopedParams,
      });
      toast.success("User deleted");
      setDeleteUserId(null);
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error(getErrorMessage(error, "Failed to delete user"));
      return false;
    } finally {
      setDeletingUserId(null);
    }
  };

  const resetUsers = useCallback(() => {
    setUsers([]);
  }, []);

  return {
    confirmDeleteUser,
    createUser,
    deleteUser,
    deleteUserId,
    deletingUserId,
    fetchUsers,
    resetUsers,
    savingUser,
    setDeleteUserId,
    setUsers,
    updateUser,
    users,
  };
}
