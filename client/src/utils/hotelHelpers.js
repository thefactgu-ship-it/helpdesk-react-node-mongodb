export function isHotelActive(hotel) {
  return hotel?.active !== false;
}

export function filterActiveHotels(hotels = []) {
  return hotels.filter(isHotelActive);
}

export function resolveSelectedHotelId(selectedHotelId, selectableHotels = []) {
  if (!selectedHotelId || selectedHotelId === "all") {
    return selectedHotelId || "all";
  }

  if (!selectableHotels.length) {
    return selectedHotelId;
  }

  const isStillSelectable = selectableHotels.some(
    (hotel) => String(hotel._id || hotel.id) === String(selectedHotelId),
  );

  return isStillSelectable ? selectedHotelId : "all";
}
