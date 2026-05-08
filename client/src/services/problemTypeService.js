import api, { authConfig } from "./api";

export async function getProblemTypes(token) {
  const res = await api.get("/problem-types", authConfig(token));
  return res.data;
}

export async function createProblemType(token, payload) {
  const res = await api.post("/problem-types", payload, authConfig(token));
  return res.data;
}
