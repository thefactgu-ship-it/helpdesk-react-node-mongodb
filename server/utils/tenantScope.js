const mongoose = require("mongoose");
const Hotel = require("../models/Hotel");
const { GROUP_ROLES, MANAGER_ROLES, HOTEL_ADMIN_ROLES, STAFF_ROLES } = require("../constants");

function toObjectId(value) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

function getUserHotelId(user) {
  return String(user?.hotelId?._id || user?.hotelId || "");
}

function isGroupRole(user) {
  return GROUP_ROLES.includes(user?.role);
}

function canManageHotels(user) {
  return isGroupRole(user);
}

function canManageHotelData(user) {
  return HOTEL_ADMIN_ROLES.includes(user?.role);
}

function canManageTickets(user) {
  return MANAGER_ROLES.includes(user?.role);
}

function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

function getHotelAccessIds(user) {
  const ids = [];
  const ownHotelId = getUserHotelId(user);

  if (ownHotelId) ids.push(ownHotelId);

  for (const hotelId of user?.hotelAccess || []) {
    const normalized = String(hotelId?._id || hotelId || "");
    if (normalized) ids.push(normalized);
  }

  return [...new Set(ids)];
}

async function getAllowedHotelIds(user) {
  if (!user) return [];
  if (isGroupRole(user)) {
    const hotels = await Hotel.find({ active: { $ne: false } }).select("_id");
    return hotels.map((hotel) => String(hotel._id));
  }

  if (user.role === "RegionalManager" && user.regions?.length) {
    const hotels = await Hotel.find({
      active: { $ne: false },
      region: { $in: user.regions },
    }).select("_id");
    return hotels.map((hotel) => String(hotel._id));
  }

  return getHotelAccessIds(user);
}

async function buildHotelScopeQuery(user, query = {}) {
  const allowedHotelIds = await getAllowedHotelIds(user);
  if (!allowedHotelIds.length) return { hotelId: { $exists: false } };

  const requestedHotelIds = normalizeList(query.hotelIds || query.hotelId);
  let scopedHotelIds = allowedHotelIds;

  if (requestedHotelIds.length) {
    scopedHotelIds = requestedHotelIds.filter((id) => allowedHotelIds.includes(id));
  }

  if (query.region) {
    const hotels = await Hotel.find({
      _id: { $in: scopedHotelIds.map(toObjectId).filter(Boolean) },
      region: query.region,
    }).select("_id");
    scopedHotelIds = hotels.map((hotel) => String(hotel._id));
  }

  if (!scopedHotelIds.length) return { hotelId: { $exists: false } };
  return { hotelId: { $in: scopedHotelIds.map(toObjectId).filter(Boolean) } };
}

function normalizeList(value) {
  if (!value) return [];
  const values = Array.isArray(value) ? value : String(value).split(",");
  return values
    .map((item) => String(item).trim())
    .filter((item) => mongoose.Types.ObjectId.isValid(item));
}

function buildDateRangeQuery(query = {}) {
  const createdAt = {};
  if (query.from) createdAt.$gte = new Date(query.from);
  if (query.to) createdAt.$lte = new Date(query.to);
  return Object.keys(createdAt).length ? { createdAt } : {};
}

module.exports = {
  buildDateRangeQuery,
  buildHotelScopeQuery,
  canManageHotelData,
  canManageHotels,
  canManageTickets,
  getAllowedHotelIds,
  getHotelAccessIds,
  getUserHotelId,
  isGroupRole,
  isStaffRole,
  toObjectId,
};
