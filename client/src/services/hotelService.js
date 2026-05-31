import api, { authConfig } from "./api";

export async function getHotels(token, options = {}) {
  const params = options.includeInactive ? { includeInactive: "true" } : undefined;
  const res = await api.get("/hotels", { ...authConfig(token), params });
  return res.data;
}

export async function createHotel(token, payload) {
  const res = await api.post("/hotels", payload, authConfig(token));
  return res.data;
}

export async function updateHotel(token, id, payload) {
  const res = await api.patch(`/hotels/${id}`, payload, authConfig(token));
  return res.data;
}

export async function deactivateHotel(token, id) {
  const res = await api.delete(`/hotels/${id}`, authConfig(token));
  return res.data;
}
