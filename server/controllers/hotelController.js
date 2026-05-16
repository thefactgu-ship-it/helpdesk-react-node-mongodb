const Hotel = require("../models/Hotel");
const { canManageHotels } = require("../utils/tenantScope");
const { sendError } = require("../utils/errorHandler");
const auditLog = require("../utils/auditLogger");

async function getHotels(req, res) {
  try {
    const query = canManageHotels(req.user)
      ? {}
      : { _id: { $in: [req.user.hotelId, ...(req.user.hotelAccess || [])].filter(Boolean) } };

    const hotels = await Hotel.find(query).sort({ region: 1, name: 1 });
    res.json(hotels);
  } catch (error) {
    sendError(res, 500, "Failed to fetch hotels", error);
  }
}

async function createHotel(req, res) {
  try {
    if (!canManageHotels(req.user)) {
      return res.status(403).json({ message: "Group admin access required" });
    }

    const hotel = await Hotel.create(buildHotelPayload(req.body));
    auditLog("hotel.created", req, { hotelId: hotel._id, code: hotel.code });
    res.status(201).json(hotel);
  } catch (error) {
    sendError(res, 400, "Failed to create hotel", error);
  }
}

async function updateHotel(req, res) {
  try {
    if (!canManageHotels(req.user)) {
      return res.status(403).json({ message: "Group admin access required" });
    }

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      buildHotelPayload(req.body, { partial: true }),
      { new: true, runValidators: true }
    );

    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    auditLog("hotel.updated", req, { hotelId: hotel._id });
    res.json(hotel);
  } catch (error) {
    sendError(res, 400, "Failed to update hotel", error);
  }
}

async function deleteHotel(req, res) {
  try {
    if (!canManageHotels(req.user)) {
      return res.status(403).json({ message: "Group admin access required" });
    }

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    auditLog("hotel.deactivated", req, { hotelId: hotel._id });
    res.json({ message: "Hotel deactivated", hotel });
  } catch (error) {
    sendError(res, 400, "Failed to deactivate hotel", error);
  }
}

function buildHotelPayload(body, options = {}) {
  const { partial = false } = options;
  const payload = {};

  copyField(payload, body, "name", partial);
  copyField(payload, body, "code", partial, (value) => value.toUpperCase());
  copyField(payload, body, "region", true);
  copyField(payload, body, "timezone", true);

  if (body.active !== undefined) {
    payload.active = Boolean(body.active);
  }

  if (body.metadata && typeof body.metadata === "object") {
    payload.metadata = body.metadata;
  }

  return payload;
}

function copyField(target, source, field, optional, transform = (value) => value) {
  if (source[field] === undefined) return;
  const value = String(source[field]).trim();
  if (!optional && !value) return;
  target[field] = transform(value);
}

module.exports = {
  createHotel,
  deleteHotel,
  getHotels,
  updateHotel,
};
