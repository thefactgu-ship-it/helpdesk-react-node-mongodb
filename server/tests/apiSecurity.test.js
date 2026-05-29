const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_with_at_least_32_chars";
process.env.NODE_ENV = "test";

const User = require("../models/User");
const Ticket = require("../models/Ticket");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const authRoutes = require("../routes/authRoutes");
const assetRoutes = require("../routes/assetRoutes");
const auditLogController = require("../controllers/auditLogController");
const departmentRoutes = require("../routes/departmentRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const problemTypeRoutes = require("../routes/problemTypeRoutes");
const ticketRoutes = require("../routes/ticketRoutes");
const ticketController = require("../controllers/ticketController");
const Asset = require("../models/Asset");
const ProblemType = require("../models/ProblemType");
const errorHandler = require("../middleware/errorHandler");
const { canManageRole } = require("../utils/roleHierarchy");
const {
  canAssignTickets,
  canManageDepartments,
  canManageHotelSettings,
  canManageTickets,
  canManageUsers,
} = require("../utils/tenantScope");
const {
  handleValidationErrors,
  updateCurrentUserValidationRules,
} = require("../validators/authValidator");

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/assets", assetRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/problem-types", problemTypeRoutes);
  app.use("/api/tickets", ticketRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use(errorHandler);
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => resolve(server));
  });
}

async function request(app, path, options = {}) {
  const server = await listen(app);
  const { port } = server.address();
  const headers = { ...(options.headers || {}) };
  let body;

  if (options.body) {
    body = JSON.stringify(options.body);
    headers["content-type"] = "application/json";
  }

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: options.method || "GET",
      headers,
      body,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return { status: response.status, data };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function authHeaderFor(userId = "507f1f77bcf86cd799439011") {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return { authorization: `Bearer ${token}` };
}

function mockAuthenticatedUser(role, overrides = {}) {
  return {
    _id: overrides.id || "507f1f77bcf86cd799439011",
    active: overrides.active !== false,
    role,
    team: overrides.team || "IT",
    departmentId: overrides.departmentId || null,
    departmentName: overrides.departmentName || "IT",
    hotelId: overrides.hotelId || "507f1f77bcf86cd799439012",
    hotelAccess: overrides.hotelAccess || [overrides.hotelId || "507f1f77bcf86cd799439012"],
    regions: overrides.regions || [],
  };
}

function stubUserFindById(user) {
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => user,
  });
  return () => {
    User.findById = originalFindById;
  };
}

function stubScopedTicket(ticket) {
  const originalFindOne = Ticket.findOne;
  Ticket.findOne = () => ({
    populate: async () => ticket,
  });

  return () => {
    Ticket.findOne = originalFindOne;
  };
}

test("auth API rejects invalid registration payload before hitting persistence", async () => {
  const app = createTestApp();

  const response = await request(app, "/api/auth/register", {
    method: "POST",
    body: { email: "not-an-email", password: "short" },
  });

  assert.equal(response.status, 400);
  assert.equal(response.data.message, "Validation error");
  assert.ok(response.data.errors.some((error) => error.field === "name"));
  assert.ok(response.data.errors.some((error) => error.field === "email"));
});

test("auth API rejects malformed login payload", async () => {
  const app = createTestApp();

  const response = await request(app, "/api/auth/login", {
    method: "POST",
    body: { email: "not-an-email", password: "" },
  });

  assert.equal(response.status, 400);
  assert.equal(response.data.message, "Validation error");
});

test("login only searches active accounts", async () => {
  const originalFind = User.find;
  let capturedQuery = null;

  User.find = (query) => {
    capturedQuery = query;
    return {
      sort: async () => [],
    };
  };

  try {
    const app = createTestApp();
    const response = await request(app, "/api/auth/login", {
      method: "POST",
      body: { email: "inactive@example.com", password: "password123" },
    });

    assert.equal(response.status, 401);
    assert.deepEqual(capturedQuery.active, { $ne: false });
  } finally {
    User.find = originalFind;
  }
});

test("profile update rejects role, department, and team changes", async () => {
  const app = express();
  app.use(express.json());
  app.patch(
    "/me",
    updateCurrentUserValidationRules(),
    handleValidationErrors,
    (req, res) => res.json({ ok: true })
  );

  const response = await request(app, "/me", {
    method: "PATCH",
    body: {
      name: "Test User",
      email: "test@example.com",
      role: "GroupAdmin",
      departmentId: "507f1f77bcf86cd799439012",
      team: "IT",
    },
  });

  assert.equal(response.status, 400);
  assert.equal(response.data.message, "Validation error");
  assert.ok(response.data.errors.some((error) => error.field === "role"));
  assert.ok(response.data.errors.some((error) => error.field === "departmentId"));
  assert.ok(response.data.errors.some((error) => error.field === "team"));
});

test("ticket API requires authentication", async () => {
  const app = createTestApp();

  const response = await request(app, "/api/tickets", { method: "GET" });

  assert.equal(response.status, 401);
  assert.equal(response.data.message, "No token provided");
});

test("notification stream requires authentication", async () => {
  const app = createTestApp();

  const response = await request(app, "/api/notifications/stream", { method: "GET" });

  assert.equal(response.status, 401);
  assert.equal(response.data.message, "No token provided");
});

test("auth middleware rejects invalid bearer tokens", async () => {
  const req = { headers: { authorization: "Bearer not-a-real-token" } };
  const res = mockResponse();
  let nextCalled = false;

  await authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid token");
});

test("auth middleware rejects expired bearer tokens", async () => {
  const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET, {
    expiresIn: "-1s",
  });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  await authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Token expired");
});

test("auth middleware rejects inactive accounts with existing tokens", async () => {
  const originalFindById = User.findById;
  const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockResponse();
  let nextCalled = false;

  User.findById = () => ({
    select: async () => ({
      active: false,
      role: "Agent",
      hotelAccess: [],
    }),
  });

  try {
    await authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, "Account is inactive");
  } finally {
    User.findById = originalFindById;
  }
});

test("admin password reset invalidates existing user tokens", async () => {
  const originalFindOne = User.findOne;
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const hotelId = "507f1f77bcf86cd799439012";
  const targetUserId = "507f1f77bcf86cd799439011";
  let capturedUpdate = null;

  User.findOne = async () => ({
    _id: targetUserId,
    role: "Agent",
    hotelId,
    hotelAccess: [hotelId],
  });
  User.findOneAndUpdate = (query, update) => {
    capturedUpdate = update;
    return {
      select() {
        return this;
      },
      populate() {
        return this;
      },
      then(resolve) {
        resolve({ _id: targetUserId, role: "Agent" });
      },
    };
  };

  try {
    const req = {
      body: { name: "Agent One", email: "agent@example.com", password: "new-password" },
      params: { id: targetUserId },
      query: {},
      user: { id: "507f1f77bcf86cd799439013", role: "Manager", hotelId, hotelAccess: [hotelId] },
    };
    const res = mockResponse();

    await authController.updateUser(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(capturedUpdate.password);
    assert.ok(capturedUpdate.passwordChangedAt instanceof Date);
    assert.equal(capturedUpdate.mustChangePassword, true);
  } finally {
    User.findOne = originalFindOne;
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("auth middleware blocks app access until forced password change is completed", async () => {
  const originalFindById = User.findById;
  const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  const req = {
    baseUrl: "/api/tickets",
    path: "/",
    headers: { authorization: `Bearer ${token}` },
  };
  const res = mockResponse();
  let nextCalled = false;

  User.findById = () => ({
    select: async () => ({
      active: true,
      role: "User",
      hotelAccess: [],
      mustChangePassword: true,
    }),
  });

  try {
    await authMiddleware(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "PASSWORD_CHANGE_REQUIRED");
  } finally {
    User.findById = originalFindById;
  }
});

test("hotel admin cannot assign group-level roles", async () => {
  const req = {
    body: { role: "GroupAdmin" },
    params: { id: "507f1f77bcf86cd799439011" },
    query: {},
    user: {
      id: "507f1f77bcf86cd799439013",
      role: "HotelAdmin",
      hotelId: "507f1f77bcf86cd799439012",
      hotelAccess: ["507f1f77bcf86cd799439012"],
    },
  };
  const res = mockResponse();

  await authController.updateUser(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "You cannot assign this role");
});

test("hotel admin cannot edit hotel admin accounts", async () => {
  const originalFindOne = User.findOne;
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const hotelId = "507f1f77bcf86cd799439012";
  let updateCalled = false;

  User.findOne = async () => ({
    _id: "507f1f77bcf86cd799439011",
    role: "HotelAdmin",
    hotelId,
    hotelAccess: [hotelId],
  });
  User.findOneAndUpdate = () => {
    updateCalled = true;
    throw new Error("Unexpected update");
  };

  try {
    const req = {
      body: { name: "Hotel Admin Two" },
      params: { id: "507f1f77bcf86cd799439011" },
      query: {},
      user: { id: "507f1f77bcf86cd799439013", role: "HotelAdmin", hotelId, hotelAccess: [hotelId] },
    };
    const res = mockResponse();

    await authController.updateUser(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "You cannot edit a user with this role");
    assert.equal(updateCalled, false);
  } finally {
    User.findOne = originalFindOne;
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("role hierarchy blocks lower roles from managing higher roles", () => {
  assert.equal(canManageRole("HotelAdmin", "Manager"), true);
  assert.equal(canManageRole("HotelAdmin", "GroupAdmin"), false);
  assert.equal(canManageRole("Manager", "HotelAdmin"), false);
  assert.equal(canManageRole("GroupAdmin", "Admin"), true);
});

test("role permission matrix separates ticket, user, department, and hotel settings capabilities", () => {
  assert.equal(canManageTickets({ role: "Manager" }), true);
  assert.equal(canAssignTickets({ role: "Manager" }), true);
  assert.equal(canManageUsers({ role: "Manager" }), false);
  assert.equal(canManageDepartments({ role: "Manager" }), false);
  assert.equal(canManageHotelSettings({ role: "Manager" }), false);

  assert.equal(canManageTickets({ role: "HotelAdmin" }), true);
  assert.equal(canAssignTickets({ role: "HotelAdmin" }), true);
  assert.equal(canManageUsers({ role: "HotelAdmin" }), true);
  assert.equal(canManageDepartments({ role: "HotelAdmin" }), true);
  assert.equal(canManageHotelSettings({ role: "HotelAdmin" }), true);

  assert.equal(canManageTickets({ role: "Agent" }), false);
  assert.equal(canAssignTickets({ role: "Agent" }), false);
  assert.equal(canManageUsers({ role: "Agent" }), false);
  assert.equal(canManageDepartments({ role: "Agent" }), false);
  assert.equal(canManageHotelSettings({ role: "Agent" }), false);
});

test("manager cannot access department or user management APIs", async () => {
  const restoreUserFindById = stubUserFindById(mockAuthenticatedUser("Manager"));

  try {
    const app = createTestApp();
    const headers = authHeaderFor();

    const departmentResponse = await request(app, "/api/departments", {
      method: "POST",
      headers,
      body: { name: "Front Office", code: "FO" },
    });
    const userResponse = await request(app, "/api/auth/users", {
      method: "POST",
      headers,
      body: { name: "Agent Two", email: "agent2@example.com", password: "password123" },
    });

    assert.equal(departmentResponse.status, 403);
    assert.equal(departmentResponse.data.message, "Department management access denied");
    assert.equal(userResponse.status, 403);
    assert.equal(userResponse.data.message, "Admin access required");
  } finally {
    restoreUserFindById();
  }
});

test("agent and requester cannot read asset settings API", async () => {
  for (const role of ["Agent", "User"]) {
    const restoreUserFindById = stubUserFindById(mockAuthenticatedUser(role));

    try {
      const app = createTestApp();
      const response = await request(app, "/api/assets", {
        method: "GET",
        headers: authHeaderFor(),
      });

      assert.equal(response.status, 403);
      assert.equal(response.data.message, "Hotel settings access required");
    } finally {
      restoreUserFindById();
    }
  }
});

test("requester can read problem types for ticket creation", async () => {
  const restoreUserFindById = stubUserFindById(mockAuthenticatedUser("User"));
  const originalFind = ProblemType.find;
  let capturedQuery = null;

  ProblemType.find = (query) => {
    capturedQuery = query;
    return {
      sort() {
        return this;
      },
      populate() {
        return this;
      },
      then(resolve) {
        resolve([]);
      },
    };
  };

  try {
    const app = createTestApp();
    const response = await request(app, "/api/problem-types", {
      method: "GET",
      headers: authHeaderFor(),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.data, []);
    assert.deepEqual(capturedQuery, {});
  } finally {
    ProblemType.find = originalFind;
    restoreUserFindById();
  }
});

test("hotel admin can manage scoped asset and problem type settings", async () => {
  const hotelId = "507f1f77bcf86cd799439012";
  const restoreUserFindById = stubUserFindById(
    mockAuthenticatedUser("HotelAdmin", { hotelId, hotelAccess: [hotelId] })
  );
  const originalAssetCreate = Asset.create;
  const originalProblemTypeCreate = ProblemType.create;
  let capturedAsset = null;
  let capturedProblemType = null;

  Asset.create = async (payload) => {
    capturedAsset = payload;
    return {
      _id: "507f1f77bcf86cd799439021",
      hotelId: payload.hotelId,
      lifeCycle: {},
      status: payload.status || "Active",
      async populate() {},
      toObject() {
        return {
          _id: this._id,
          ...payload,
          lifeCycle: payload.lifeCycle || {},
          status: payload.status || "Active",
        };
      },
    };
  };
  ProblemType.create = async (payload) => {
    capturedProblemType = payload;
    return {
      _id: "507f1f77bcf86cd799439022",
      ...payload,
      async populate() {},
    };
  };

  try {
    const app = createTestApp();
    const headers = authHeaderFor();
    const assetResponse = await request(app, "/api/assets", {
      method: "POST",
      headers,
      body: {
        assetName: "Front Office PC",
        assetType: "Desktop",
        serialNumber: "FO-PC-001",
        hotelId,
      },
    });
    const problemTypeResponse = await request(app, "/api/problem-types", {
      method: "POST",
      headers,
      body: {
        name: "Door Lock",
        description: "Door lock and encoder issues",
        hotelId,
      },
    });

    assert.equal(assetResponse.status, 201);
    assert.equal(String(capturedAsset.hotelId), hotelId);
    assert.equal(problemTypeResponse.status, 201);
    assert.equal(String(capturedProblemType.hotelId), hotelId);
  } finally {
    Asset.create = originalAssetCreate;
    ProblemType.create = originalProblemTypeCreate;
    restoreUserFindById();
  }
});

test("audit log query scopes hotel admin to hotel access", async () => {
  const hotelId = "507f1f77bcf86cd799439012";
  const query = await auditLogController._private.buildAuditLogQuery({
    query: {},
    user: { id: "507f1f77bcf86cd799439013", role: "HotelAdmin", hotelId, hotelAccess: [hotelId] },
  });

  assert.deepEqual(query.hotelId.$in.map(String), [hotelId]);
});

test("group admin audit log query can read across hotels by default", async () => {
  const query = await auditLogController._private.buildAuditLogQuery({
    query: {},
    user: { id: "507f1f77bcf86cd799439013", role: "GroupAdmin" },
  });

  assert.equal(query.hotelId, undefined);
});

test("agent visibility includes active unassigned tickets in hotel scope", () => {
  const query = ticketController._private.buildTicketVisibilityQuery({
    id: "507f1f77bcf86cd799439011",
    role: "Agent",
    hotelId: "507f1f77bcf86cd799439012",
  });

  assert.ok(query.$or.some((condition) => {
    return (
      condition.status?.$nin?.includes("closed") &&
      condition.$or?.some((item) => item.assignedTo === null)
    );
  }));

  assert.equal(
    ticketController._private.canAccessTicket(
      {
        id: "507f1f77bcf86cd799439011",
        role: "Agent",
        hotelId: "507f1f77bcf86cd799439012",
      },
      {
        hotelId: "507f1f77bcf86cd799439012",
        status: "open",
        assignedTo: null,
      }
    ),
    true
  );

  assert.equal(
    ticketController._private.canAccessTicket(
      {
        id: "507f1f77bcf86cd799439011",
        role: "Agent",
        hotelId: "507f1f77bcf86cd799439012",
      },
      {
        hotelId: "507f1f77bcf86cd799439012",
        status: "in_progress",
        assignedTo: "507f1f77bcf86cd799439013",
      }
    ),
    false
  );
});

test("requester visibility includes same-department ticket history", () => {
  const departmentId = "507f1f77bcf86cd799439015";
  const query = ticketController._private.buildTicketVisibilityQuery({
    id: "507f1f77bcf86cd799439011",
    role: "User",
    hotelId: "507f1f77bcf86cd799439012",
    departmentId,
    departmentName: "Front Office",
  });

  const departmentCondition = query.$or.find((condition) =>
    condition.$or?.some((item) => item.departmentId === departmentId)
  );

  assert.ok(departmentCondition);
  assert.equal(departmentCondition.status, undefined);
  assert.deepEqual(departmentCondition.visibility, { $ne: "private" });
});

test("agent same-department visibility remains active-only", () => {
  const departmentId = "507f1f77bcf86cd799439015";
  const query = ticketController._private.buildTicketVisibilityQuery({
    id: "507f1f77bcf86cd799439011",
    role: "Agent",
    hotelId: "507f1f77bcf86cd799439012",
    departmentId,
    departmentName: "Front Office",
  });

  const departmentCondition = query.$or.find((condition) =>
    condition.$or?.some((item) => item.departmentId === departmentId)
  );

  assert.ok(departmentCondition);
  assert.deepEqual(departmentCondition.status, { $nin: ["resolved", "closed"] });
  assert.deepEqual(departmentCondition.visibility, { $ne: "private" });
});

test("ticket visibility auto-private protects sensitive categories", () => {
  assert.equal(
    ticketController._private.resolveTicketVisibility({
      title: "Reset password",
      description: "User cannot login",
      category: "Account",
      canSetVisibility: false,
    }),
    "private"
  );

  assert.equal(
    ticketController._private.resolveTicketVisibility({
      requestedVisibility: "normal",
      title: "Reset password",
      category: "Account",
      canSetVisibility: true,
    }),
    "normal"
  );
});

test("ticket status audit actions are specific for resolved and closed states", () => {
  assert.equal(ticketController._private.getTicketStatusAuditAction("resolved"), "ticket.resolved");
  assert.equal(ticketController._private.getTicketStatusAuditAction("closed"), "ticket.closed");
  assert.equal(ticketController._private.getTicketStatusAuditAction("in_progress"), "ticket.status_changed");
});

test("ticket update rejects edits to closed tickets before persistence update", async () => {
  const originalFindOneAndUpdate = Ticket.findOneAndUpdate;
  let updateCalled = false;
  const hotelId = "507f1f77bcf86cd799439012";
  const restoreTicket = stubScopedTicket({
    _id: "507f1f77bcf86cd799439021",
    hotelId,
    status: "closed",
    assignedTo: "507f1f77bcf86cd799439014",
  });

  Ticket.findOneAndUpdate = () => {
    updateCalled = true;
    throw new Error("Unexpected update");
  };

  try {
    const req = {
      body: { assignedTo: "507f1f77bcf86cd799439015" },
      params: { id: "507f1f77bcf86cd799439021" },
      query: {},
      user: mockAuthenticatedUser("Manager", { hotelId, hotelAccess: [hotelId] }),
    };
    const res = mockResponse();

    await ticketController.updateTicket(req, res);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Ticket is closed. Reopen it before editing or assigning.");
    assert.equal(updateCalled, false);
  } finally {
    restoreTicket();
    Ticket.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("ticket status update rejects reopening closed tickets before persistence update", async () => {
  const originalFindOneAndUpdate = Ticket.findOneAndUpdate;
  let updateCalled = false;
  const hotelId = "507f1f77bcf86cd799439012";
  const restoreTicket = stubScopedTicket({
    _id: "507f1f77bcf86cd799439021",
    hotelId,
    status: "closed",
    assignedTo: "507f1f77bcf86cd799439014",
  });

  Ticket.findOneAndUpdate = () => {
    updateCalled = true;
    throw new Error("Unexpected update");
  };

  try {
    const req = {
      body: { status: "in_progress" },
      params: { id: "507f1f77bcf86cd799439021" },
      query: {},
      user: mockAuthenticatedUser("Manager", { hotelId, hotelAccess: [hotelId] }),
    };
    const res = mockResponse();

    await ticketController.updateTicketStatus(req, res);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Ticket is closed. Reopen it before editing or assigning.");
    assert.equal(updateCalled, false);
  } finally {
    restoreTicket();
    Ticket.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("ticket status update enforces forward workflow transitions", async () => {
  const originalFindOneAndUpdate = Ticket.findOneAndUpdate;
  let updateCalled = false;
  const hotelId = "507f1f77bcf86cd799439012";
  const restoreTicket = stubScopedTicket({
    _id: "507f1f77bcf86cd799439021",
    hotelId,
    status: "open",
    assignedTo: "507f1f77bcf86cd799439014",
  });

  Ticket.findOneAndUpdate = () => {
    updateCalled = true;
    throw new Error("Unexpected update");
  };

  try {
    const req = {
      body: { status: "resolved" },
      params: { id: "507f1f77bcf86cd799439021" },
      query: {},
      user: mockAuthenticatedUser("Manager", { hotelId, hotelAccess: [hotelId] }),
    };
    const res = mockResponse();

    await ticketController.updateTicketStatus(req, res);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Invalid status transition from open to resolved");
    assert.equal(updateCalled, false);
  } finally {
    restoreTicket();
    Ticket.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("admin close requires and records a close reason", async () => {
  const originalFindOneAndUpdate = Ticket.findOneAndUpdate;
  let updateCalled = false;
  const hotelId = "507f1f77bcf86cd799439012";
  const ticketId = "507f1f77bcf86cd799439021";
  const restoreTicket = stubScopedTicket({
    _id: ticketId,
    hotelId,
    status: "open",
    assignedTo: "507f1f77bcf86cd799439014",
  });

  Ticket.findOneAndUpdate = () => {
    updateCalled = true;
    throw new Error("Unexpected update");
  };

  try {
    const req = {
      body: { status: "closed" },
      params: { id: ticketId },
      query: {},
      user: mockAuthenticatedUser("Manager", { hotelId, hotelAccess: [hotelId] }),
    };
    const res = mockResponse();

    await ticketController.updateTicketStatus(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Admin close reason is required");
    assert.equal(updateCalled, false);
  } finally {
    restoreTicket();
    Ticket.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("admin close stores close reason in activity log", async () => {
  const originalFindOneAndUpdate = Ticket.findOneAndUpdate;
  const hotelId = "507f1f77bcf86cd799439012";
  const ticketId = "507f1f77bcf86cd799439021";
  let capturedUpdate = null;
  const restoreTicket = stubScopedTicket({
    _id: ticketId,
    hotelId,
    status: "resolved",
    assignedTo: "507f1f77bcf86cd799439014",
  });

  Ticket.findOneAndUpdate = (query, update) => {
    capturedUpdate = update;
    return {
      populate: async () => ({
        _id: query._id,
        hotelId,
        status: update.status,
      }),
    };
  };

  try {
    const req = {
      body: { status: "closed", adminCloseReason: "Requester confirmed by phone" },
      params: { id: ticketId },
      query: {},
      user: mockAuthenticatedUser("Manager", { hotelId, hotelAccess: [hotelId] }),
    };
    const res = mockResponse();

    await ticketController.updateTicketStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(capturedUpdate.status, "closed");
    assert.match(capturedUpdate.$push.activityLog.details, /Requester confirmed by phone/);
  } finally {
    restoreTicket();
    Ticket.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("ticket assignment rejects closed tickets before checking assignee", async () => {
  const originalFindOneAndUpdate = Ticket.findOneAndUpdate;
  const originalUserFindById = User.findById;
  let updateCalled = false;
  let assigneeLookupCalled = false;
  const hotelId = "507f1f77bcf86cd799439012";
  const restoreTicket = stubScopedTicket({
    _id: "507f1f77bcf86cd799439021",
    hotelId,
    status: "closed",
    assignedTo: null,
  });

  Ticket.findOneAndUpdate = () => {
    updateCalled = true;
    throw new Error("Unexpected update");
  };
  User.findById = () => {
    assigneeLookupCalled = true;
    throw new Error("Unexpected assignee lookup");
  };

  try {
    const req = {
      body: { assignedTo: "507f1f77bcf86cd799439015" },
      params: { id: "507f1f77bcf86cd799439021" },
      query: {},
      user: mockAuthenticatedUser("Manager", { hotelId, hotelAccess: [hotelId] }),
    };
    const res = mockResponse();

    await ticketController.assignTicket(req, res);

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Ticket is closed. Reopen it before editing or assigning.");
    assert.equal(updateCalled, false);
    assert.equal(assigneeLookupCalled, false);
  } finally {
    restoreTicket();
    Ticket.findOneAndUpdate = originalFindOneAndUpdate;
    User.findById = originalUserFindById;
  }
});

test("ticket reopen allows requester and restores active status", async () => {
  const originalFindOneAndUpdate = Ticket.findOneAndUpdate;
  const hotelId = "507f1f77bcf86cd799439012";
  const requesterId = "507f1f77bcf86cd799439011";
  let capturedUpdate = null;
  const restoreTicket = stubScopedTicket({
    _id: "507f1f77bcf86cd799439021",
    hotelId,
    status: "closed",
    assignedTo: requesterId,
    requesterUserId: requesterId,
    createdBy: requesterId,
  });

  Ticket.findOneAndUpdate = (query, update) => {
    capturedUpdate = update;
    return {
      populate: async () => ({
        _id: query._id,
        hotelId,
        status: update.status,
        assignedTo: requesterId,
        requesterUserId: requesterId,
        createdBy: requesterId,
      }),
    };
  };

  try {
    const req = {
      body: {},
      params: { id: "507f1f77bcf86cd799439021" },
      query: {},
      user: {
        id: requesterId,
        _id: requesterId,
        role: "User",
        hotelId,
        hotelAccess: [hotelId],
      },
    };
    const res = mockResponse();

    await ticketController.reopenTicket(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, "in_progress");
    assert.equal(capturedUpdate.status, "in_progress");
    assert.equal(capturedUpdate.resolvedAt, null);
    assert.equal(capturedUpdate.$push.activityLog.action, "reopened");
  } finally {
    restoreTicket();
    Ticket.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("ticket reopen rejects assigned agent on closed ticket", async () => {
  const originalFindOneAndUpdate = Ticket.findOneAndUpdate;
  const hotelId = "507f1f77bcf86cd799439012";
  const requesterId = "507f1f77bcf86cd799439011";
  const agentId = "507f1f77bcf86cd799439014";
  let updateCalled = false;
  const restoreTicket = stubScopedTicket({
    _id: "507f1f77bcf86cd799439021",
    hotelId,
    status: "closed",
    assignedTo: agentId,
    requesterUserId: requesterId,
    createdBy: requesterId,
  });

  Ticket.findOneAndUpdate = () => {
    updateCalled = true;
    throw new Error("Unexpected update");
  };

  try {
    const req = {
      body: {},
      params: { id: "507f1f77bcf86cd799439021" },
      query: {},
      user: {
        id: agentId,
        _id: agentId,
        role: "Agent",
        hotelId,
        hotelAccess: [hotelId],
      },
    };
    const res = mockResponse();

    await ticketController.reopenTicket(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Only the requester, manager, or admin can reopen this ticket");
    assert.equal(updateCalled, false);
  } finally {
    restoreTicket();
    Ticket.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
