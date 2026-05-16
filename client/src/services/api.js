import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

export default axios.create({
  baseURL: API_BASE_URL,
});
