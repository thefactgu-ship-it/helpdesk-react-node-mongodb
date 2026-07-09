import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL, AUTH_EXPIRED_EVENT, setupAuthResponseInterceptor } from "../services/api";
import { getErrorMessage, getStoredUser } from "../utils/entityHelpers";

const AUTH_URL = `${API_BASE_URL}/auth`;

/**
 * Custom hook encapsulating all authentication state and operations.
 *
 * Manages: token, currentUser, profile updates, password changes,
 * the PASSWORD_CHANGE_REQUIRED interceptor, and login/logout flows.
 */
export function useAuth({ onPasswordChangeRequired, t }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileInitialSection, setProfileInitialSection] = useState("profile");
  const [activePage, setActivePage] = useState("dashboard");

  const passwordChangeToastShownRef = useRef(false);

  const handleLogout = useCallback(() => {
    passwordChangeToastShownRef.current = false;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem("selectedHotelId");
    setActivePage("dashboard");
    toast.success("Logged out");
  }, []);

  const authHeaders = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    [token],
  );

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.data?.code === "PASSWORD_CHANGE_REQUIRED") {
          const storedUser = getStoredUser();
          const forcedUser = {
            ...(storedUser || {}),
            ...(currentUser || {}),
            mustChangePassword: true,
          };

          localStorage.setItem("user", JSON.stringify(forcedUser));
          setCurrentUser(forcedUser);
          setActivePage("profile");
          setProfileInitialSection("password");
          onPasswordChangeRequired?.();

          if (!passwordChangeToastShownRef.current) {
            toast.error(t("common.passwordChangeRequired"));
            passwordChangeToastShownRef.current = true;
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [currentUser, onPasswordChangeRequired, t]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleAuthExpired = () => {
      if (!token) return;
      handleLogout();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    const authInterceptorId = setupAuthResponseInterceptor(axios);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
      axios.interceptors.response.eject(authInterceptorId);
    };
  }, [handleLogout, token]);

  const handleLogin = async (loginForm) => {
    try {
      const res = await axios.post(`${AUTH_URL}/login`, loginForm);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      passwordChangeToastShownRef.current = false;
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setActivePage(res.data.user?.mustChangePassword ? "profile" : "dashboard");
      toast.success(
        res.data.user?.mustChangePassword
          ? t("common.passwordChangeRequired")
          : t("common.loginSuccessful"),
      );
      return true;
    } catch (error) {
      console.error("Login failed", error);
      toast.error(getErrorMessage(error, "Login failed"));
      return false;
    }
  };

  const handleGoogleLogin = async (credential) => {
    try {
      const res = await axios.post(`${AUTH_URL}/google`, { credential });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      passwordChangeToastShownRef.current = false;
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setActivePage(res.data.user?.mustChangePassword ? "profile" : "dashboard");
      toast.success(t("common.loginSuccessful"));
      return true;
    } catch (error) {
      console.error("Google login failed", error);
      toast.error(getErrorMessage(error, "Google login failed"));
      return false;
    }
  };

  const openProfilePage = useCallback((section = "profile") => {
    setProfileInitialSection(section);
    setActivePage("profile");
  }, []);

  const updateMyProfile = async (profileForm, validationMessage) => {
    if (validationMessage) {
      toast.error(validationMessage);
      return false;
    }

    if (!profileForm) return false;

    try {
      setSavingProfile(true);
      const res = await axios.patch(`${AUTH_URL}/me`, profileForm, {
        headers: authHeaders,
      });
      setCurrentUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      toast.success("Profile updated");
      return true;
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error(getErrorMessage(error, "Failed to update profile"));
      return false;
    } finally {
      setSavingProfile(false);
    }
  };

  const changeMyPassword = async (passwordForm, validationMessage) => {
    if (validationMessage) {
      toast.error(validationMessage);
      return false;
    }

    if (!passwordForm) return false;

    try {
      setChangingPassword(true);
      await axios.patch(`${AUTH_URL}/me/password`, passwordForm, {
        headers: authHeaders,
      });
      toast.success("Password updated. Please log in again.");
      passwordChangeToastShownRef.current = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setCurrentUser(null);
      setActivePage("dashboard");
      return true;
    } catch (error) {
      console.error("Failed to update password", error);
      toast.error(getErrorMessage(error, "Failed to update password"));
      return false;
    } finally {
      setChangingPassword(false);
    }
  };

  return {
    activePage,
    authHeaders,
    changeMyPassword,
    changingPassword,
    currentUser,
    handleGoogleLogin,
    handleLogin,
    handleLogout,
    openProfilePage,
    profileInitialSection,
    savingProfile,
    setActivePage,
    setCurrentUser,
    token,
    updateMyProfile,
  };
}
