import api, { authConfig } from "./api";

export async function getProblemTypes(token, params) {
  const res = await api.get("/problem-types", authConfig(token, params));
  return res.data;
}

export async function createProblemType(token, payload, params) {
  const res = await api.post("/problem-types", payload, authConfig(token, params));
  return res.data;
}

export async function deleteProblemType(token, id, params) {
  const res = await api.delete(`/problem-types/${id}`, authConfig(token, params));
  return res.data;
}
