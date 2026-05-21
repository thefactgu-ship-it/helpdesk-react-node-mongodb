import api, { authConfig } from "./api";

export async function getAuditLogs(token, params) {
  const res = await api.get("/audit-logs", authConfig(token, params));
  return res.data;
}
