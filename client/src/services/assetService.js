import api, { authConfig } from "./api";

export async function getAssets(token) {
  const res = await api.get("/assets", authConfig(token));
  return res.data;
}

export async function createAsset(token, payload) {
  const res = await api.post("/assets", payload, authConfig(token));
  return res.data;
}

export async function updateAsset(token, id, payload) {
  const res = await api.patch(`/assets/${id}`, payload, authConfig(token));
  return res.data;
}

export async function deleteAsset(token, id) {
  const res = await api.delete(`/assets/${id}`, authConfig(token));
  return res.data;
}
