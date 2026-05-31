/**
 * Pure utility functions for entity manipulation.
 * Extracted from App.jsx to be reusable across the application.
 */

/**
 * Extract the best error message from an axios error response.
 */
export function getErrorMessage(error, fallback) {
  const validationMessage = error?.response?.data?.errors?.[0]?.message;
  return validationMessage || error?.response?.data?.message || error?.message || fallback;
}

/**
 * Read the stored user from localStorage, returning null on failure.
 */
export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

/**
 * Normalise an entity (object with _id/id, or plain string) to its id string.
 */
export function getEntityId(entity) {
  if (typeof entity === "string") return entity;
  return String(entity?._id || entity?.id || "");
}

/**
 * Collect all hotel ids a user has access to.
 */
export function getUserHotelAccessIds(user) {
  return [
    getEntityId(user?.hotelId),
    ...(Array.isArray(user?.hotelAccess) ? user.hotelAccess.map(getEntityId) : []),
  ].filter(Boolean);
}

/**
 * Find a hotel in a list by id.
 */
export function findHotelById(hotels, hotelId) {
  if (!hotelId) return null;
  return hotels.find((hotel) => getEntityId(hotel) === String(hotelId)) || null;
}

/**
 * Format a hotel object as "CODE / Name", falling back to its id.
 */
export function formatHotelName(hotel) {
  if (!hotel) return "";
  if (typeof hotel === "string") return hotel;
  return [hotel.code, hotel.name].filter(Boolean).join(" / ") || getEntityId(hotel);
}

/**
 * Return the region or timezone of a hotel, falling back to a default.
 */
export function getHotelMeta(hotel, fallback) {
  if (!hotel || typeof hotel === "string") return fallback;
  return hotel.region || hotel.timezone || fallback;
}

/**
 * Pick text based on the current language.
 */
export function getTextByLanguage(language, thaiText, englishText) {
  return language === "th" ? thaiText : englishText;
}

/**
 * Try a translation key; return fallback if the key is not found.
 */
export function translateOr(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}
