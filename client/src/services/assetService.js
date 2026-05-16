import api, { authConfig } from "./api";

export async function getAssets(token, params) {
  const res = await api.get("/assets", authConfig(token, params));
  return res.data;
}

export async function createAsset(token, payload, params) {
  const res = await api.post("/assets", payload, authConfig(token, params));
  return res.data;
}

export async function updateAsset(token, id, payload, params) {
  const res = await api.patch(`/assets/${id}`, payload, authConfig(token, params));
  return res.data;
}

export async function deleteAsset(token, id, params) {
  const res = await api.delete(`/assets/${id}`, authConfig(token, params));
  return res.data;
}
