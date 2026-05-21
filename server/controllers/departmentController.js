const Department = require("../models/Department");
const {
  buildHotelScopeQuery,
  canManageDepartments,
  getUserHotelId,
} = require("../utils/tenantScope");
const { sendError } = require("../utils/errorHandler");
const auditLog = require("../utils/auditLogger");

async function getDepartments(req, res) {
  try {
    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const query = { ...hotelScope };

    if (req.query.active !== undefined) {
      query.active = String(req.query.active) === "true";
    }

    const departments = await Department.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .populate({ path: "hotelId", select: "name code region active" });

    res.json(departments);
  } catch (error) {
    sendError(res, 500, "Failed to fetch departments", error);
  }
}

async function createDepartment(req, res) {
  try {
    if (!canManageDepartments(req.user)) {
      return res.status(403).json({ message: "Department management access denied" });
    }

    const hotelScope = await buildHotelScopeQuery(
      req.user,
      req.body.hotelId ? { hotelId: req.body.hotelId } : req.query
    );
    const hotelId = hotelScope.hotelId?.$in?.[0] || getUserHotelId(req.user);

    if (!hotelId) {
      return res.status(400).json({ message: "Hotel is required" });
    }

    const department = await Department.create(buildDepartmentPayload(req.body, hotelId));
    auditLog("department.created", req, { departmentId: department._id, hotelId });
    res.status(201).json(department);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Department name or code already exists for this hotel" });
    }

    sendError(res, 400, "Failed to create department", error);
  }
}

async function updateDepartment(req, res) {
  try {
    if (!canManageDepartments(req.user)) {
      return res.status(403).json({ message: "Department management access denied" });
    }

    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const existing = await Department.findOne({ _id: req.params.id, ...hotelScope });

    if (!existing) {
      return res.status(404).json({ message: "Department not found" });
    }

    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, hotelId: existing.hotelId },
      buildDepartmentPayload(req.body, existing.hotelId, { partial: true }),
      { returnDocument: "after", runValidators: true }
    );

    auditLog("department.updated", req, { departmentId: department._id, hotelId: department.hotelId });
    res.json(department);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Department name or code already exists for this hotel" });
    }

    sendError(res, 400, "Failed to update department", error);
  }
}

async function deleteDepartment(req, res) {
  try {
    if (!canManageDepartments(req.user)) {
      return res.status(403).json({ message: "Department management access denied" });
    }

    const hotelScope = await buildHotelScopeQuery(req.user, req.query);
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, ...hotelScope },
      { active: false },
      { returnDocument: "after" }
    );

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    auditLog("department.deactivated", req, { departmentId: department._id, hotelId: department.hotelId });
    res.json({ message: "Department deactivated", department });
  } catch (error) {
    sendError(res, 400, "Failed to deactivate department", error);
  }
}

function buildDepartmentPayload(body, hotelId, options = {}) {
  const { partial = false } = options;
  const payload = {};

  copyField(payload, body, "name", partial);
  copyField(payload, body, "code", partial, (value) => value.toUpperCase());

  if (hotelId) payload.hotelId = hotelId;
  if (body.active !== undefined) payload.active = Boolean(body.active);
  if (body.sortOrder !== undefined) payload.sortOrder = Number(body.sortOrder) || 100;

  return payload;
}

function copyField(target, source, field, optional, transform = (value) => value) {
  if (source[field] === undefined) return;
  const value = String(source[field]).trim();
  if (!optional && !value) return;
  target[field] = transform(value);
}

module.exports = {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
};
