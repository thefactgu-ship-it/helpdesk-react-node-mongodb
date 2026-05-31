export function isHotelActive(hotel) {
  return hotel?.active !== false;
}

export function filterActiveHotels(hotels = []) {
  return hotels.filter(isHotelActive);
}
