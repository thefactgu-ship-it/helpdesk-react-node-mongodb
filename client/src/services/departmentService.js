import api, { authConfig } from "./api";

export async function getDepartments(token, params) {
  const res = await api.get("/departments", authConfig(token, params));
  return res.data;
}

export async function createDepartment(token, payload, params) {
  const res = await api.post("/departments", payload, authConfig(token, params));
  return res.data;
}

export async function updateDepartment(token, id, payload, params) {
  const res = await api.patch(`/departments/${id}`, payload, authConfig(token, params));
  return res.data;
}

export async function deactivateDepartment(token, id, params) {
  const res = await api.delete(`/departments/${id}`, authConfig(token, params));
  return res.data;
}
