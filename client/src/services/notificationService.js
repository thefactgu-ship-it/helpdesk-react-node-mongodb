import api, { authConfig } from "./api";

export async function getNotifications(token, params) {
  const res = await api.get("/notifications", authConfig(token, params));
  return res.data;
}

export async function markNotificationRead(token, id) {
  const res = await api.patch(`/notifications/${id}/read`, {}, authConfig(token));
  return res.data;
}

export async function markAllNotificationsRead(token) {
  const res = await api.patch("/notifications/read-all", {}, authConfig(token));
  return res.data;
}
