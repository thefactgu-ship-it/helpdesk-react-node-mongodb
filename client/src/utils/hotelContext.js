/**
 * Compute the active hotel context shown in the top bar chip.
 * Extracted from App.jsx for reuse and testability.
 */

import { groupRoles } from "../config/appConfig";
import {
  findHotelById,
  formatHotelName,
  getEntityId,
  getHotelMeta,
  getTextByLanguage,
  translateOr,
} from "./entityHelpers";

export function getActiveHotelContext({ currentUser, hotels, language, selectedHotelId, t }) {
  const eyebrow = getTextByLanguage(language, "โรงแรมที่ใช้งาน", "Current hotel");
  const hotelFallback = getTextByLanguage(language, "ยังไม่ระบุโรงแรม", "No hotel assigned");
  const currentScope = getTextByLanguage(language, "ขอบเขตปัจจุบัน", "Current scope");
  const primaryHotelId = getEntityId(currentUser?.hotelId);
  const selectedHotel = selectedHotelId && selectedHotelId !== "all"
    ? findHotelById(hotels, selectedHotelId)
    : null;
  const primaryHotel =
    currentUser?.hotelId && typeof currentUser.hotelId === "object"
      ? currentUser.hotelId
      : findHotelById(hotels, primaryHotelId);
  const accessHotels = Array.isArray(currentUser?.hotelAccess)
    ? currentUser.hotelAccess
        .map((hotel) => (typeof hotel === "object" ? hotel : findHotelById(hotels, hotel)))
        .filter(Boolean)
    : [];

  if (selectedHotelId && selectedHotelId !== "all") {
    return {
      detail: getHotelMeta(selectedHotel, currentScope),
      eyebrow,
      label: formatHotelName(selectedHotel) || hotelFallback,
    };
  }

  if (groupRoles.includes(currentUser?.role) && (hotels.length > 1 || accessHotels.length > 1)) {
    return {
      detail: translateOr(t, "common.groupDashboard", "Group dashboard"),
      eyebrow,
      label: translateOr(t, "common.allHotels", "All hotels"),
    };
  }

  if (primaryHotel) {
    return {
      detail: getHotelMeta(primaryHotel, currentScope),
      eyebrow,
      label: formatHotelName(primaryHotel),
    };
  }

  if (accessHotels.length === 1) {
    return {
      detail: getHotelMeta(accessHotels[0], currentScope),
      eyebrow,
      label: formatHotelName(accessHotels[0]),
    };
  }

  return {
    detail: currentScope,
    eyebrow,
    label: hotelFallback,
  };
}
