const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_with_at_least_32_chars";
process.env.NODE_ENV = "test";

const User = require("../models/User");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const authRoutes = require("../routes/authRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const ticketRoutes = require("../routes/ticketRoutes");
const ticketController = require("../controllers/ticketController");
const errorHandler = require("../middleware/errorHandler");
const { canManageRole } = require("../utils/roleHierarchy");
const {
  handleValidationErrors,
  updateCurrentUserValidationRules,
} = require("../validators/authValidator");

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
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
