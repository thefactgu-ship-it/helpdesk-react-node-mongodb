import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const AUTH_EXPIRED_EVENT = "auth:expired";

export function authConfig(token, params) {
  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      }
    : { params };
}

export function setupAuthResponseInterceptor(axiosInstance) {
  return axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || "";
      const hasActiveToken = Boolean(localStorage.getItem("token"));

      if (
        status === 401 &&
        hasActiveToken &&
        /expired|invalid token|no token provided/i.test(message)
      ) {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }

      return Promise.reject(error);
    },
  );
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

setupAuthResponseInterceptor(api);

export default api;
