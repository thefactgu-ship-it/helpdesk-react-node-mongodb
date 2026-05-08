import axios from "axios";

export const API_BASE_URL = "http://localhost:5000/api";

export function authConfig(token) {
  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};
}

export default axios.create({
  baseURL: API_BASE_URL,
});
