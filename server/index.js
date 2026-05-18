const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const bcrypt = require("bcryptjs");

// Import routes
const ticketRoutes = require("./routes/ticketRoutes");
const authRoutes = require("./routes/authRoutes");
const assetRoutes = require("./routes/assetRoutes");
const problemTypeRoutes = require("./routes/problemTypeRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const departmentRoutes = require("./routes/departmentRoutes");

// Import models
const User = require("./models/User");
const Hotel = require("./models/Hotel");
const Ticket = require("./models/Ticket");
const Asset = require("./models/Asset");
const ProblemType = require("./models/ProblemType");
const Department = require("./models/Department");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const validateEnv = require("./middleware/envValidator");
const requestContext = require("./middleware/requestContext");

require("dotenv").config();

// Validate environment variables on startup
validateEnv();

const app = express();

app.use(requestContext);

// Security middleware
app.use(helmet()); // Set security headers

// CORS configuration - restrict to allowed origins
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173", // Vite default port for local development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(sanitizeRequest);

// Uploaded files are served through protected ticket attachment routes.

// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 5 : 20,
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 20,
  message: "Too many password change attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

function sanitizeRequest(req, res, next) {
  const sanitizeOptions = { replaceWith: "_" };

  if (req.body) {
    mongoSanitize.sanitize(req.body, sanitizeOptions);
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params, sanitizeOptions);
  }
  if (req.query) {
    const sanitizedQuery = mongoSanitize.sanitize(
      { ...req.query },
      sanitizeOptions
    );

    Object.defineProperty(req, "query", {
      value: sanitizedQuery,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  }

  next();
}

async function ensureDefaultHotel() {
  const code = process.env.DEFAULT_HOTEL_CODE || "THG";
  const name = process.env.DEFAULT_HOTEL_NAME || "Thavorn Hotels Group";
  const region = process.env.DEFAULT_HOTEL_REGION || "Phuket";

  return Hotel.findOneAndUpdate(
    { code },
    {
      $setOnInsert: {
        name,
        code,
        region,
        timezone: process.env.DEFAULT_HOTEL_TIMEZONE || "Asia/Bangkok",
        active: true,
      },
    },
    { new: true, upsert: true }
  );
}

async function migrateLegacyHotelData(defaultHotel) {
  const hotelId = defaultHotel._id;

  await Promise.all([
    User.updateMany({ hotelId: { $in: [null, undefined] } }, { hotelId }),
    Ticket.updateMany({ hotelId: { $exists: false } }, { hotelId }),
    Asset.updateMany({ hotelId: { $exists: false } }, { hotelId }),
    ProblemType.updateMany({ hotelId: { $exists: false } }, { hotelId }),
    User.updateMany({ active: { $exists: false } }, { active: true }),
  ]);
}

async function ensureDefaultDepartments() {
  const hotels = await Hotel.find({ active: { $ne: false } }).select("_id");
  const defaultDepartments = [
    { name: "IT", code: "IT", sortOrder: 10 },
    { name: "Operations", code: "OPS", sortOrder: 20 },
    { name: "Finance", code: "FIN", sortOrder: 30 },
    { name: "HR", code: "HR", sortOrder: 40 },
    { name: "Sales", code: "SAL", sortOrder: 50 },
  ];

  await Promise.all(
    hotels.flatMap((hotel) =>
      defaultDepartments.map((department) =>
        Department.findOneAndUpdate(
          { hotelId: hotel._id, code: department.code },
          {
            $setOnInsert: {
              ...department,
              hotelId: hotel._id,
              active: true,
            },
          },
          { upsert: true, new: true }
        )
      )
    )
  );
}

async function ensureAdminUser(defaultHotel) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@test.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMeNow!2026";
  const adminName = process.env.ADMIN_NAME || "System Admin";

  const existingAdmin = await User.findOne({ email: adminEmail, hotelId: defaultHotel._id });

  if (existingAdmin) {
    if (!["Admin", "GroupAdmin"].includes(existingAdmin.role)) {
      existingAdmin.role = "GroupAdmin";
      existingAdmin.team = existingAdmin.team || "System";
      existingAdmin.hotelId = existingAdmin.hotelId || defaultHotel._id;
      await existingAdmin.save();
      console.log(`Admin role ensured for ${adminEmail}`);
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await User.create({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: "GroupAdmin",
    team: "System",
    hotelId: defaultHotel._id,
    hotelAccess: [defaultHotel._id],
  });

  console.log(`Default admin created: ${adminEmail}`);
}

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    const defaultHotel = await ensureDefaultHotel();
    await migrateLegacyHotelData(defaultHotel);
    await ensureDefaultDepartments();
    await ensureAdminUser(defaultHotel);
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "HelpDesk API Running", status: "ok" });
});

app.get("/healthz", (req, res) => {
  res.json({
    status: "ok",
    service: "helpdesk-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/readyz", (req, res) => {
  const storageProvider = String(
    process.env.ATTACHMENT_STORAGE_PROVIDER || "local"
  ).toLowerCase();
  const missingS3Envs =
    storageProvider === "s3"
      ? [
          "S3_ENDPOINT",
          "S3_BUCKET",
          "S3_REGION",
          "S3_ACCESS_KEY_ID",
          "S3_SECRET_ACCESS_KEY",
        ].filter((env) => !process.env[env])
      : [];
  const checks = {
    database: mongoose.connection.readyState === 1 ? "connected" : "not_connected",
    storage:
      storageProvider === "s3" && missingS3Envs.length === 0
        ? "configured"
        : storageProvider === "local" && process.env.NODE_ENV !== "production"
          ? "local_development"
          : "not_configured",
  };
  const ready =
    checks.database === "connected" &&
    (checks.storage === "configured" || checks.storage === "local_development");

  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    checks,
    missingS3Envs,
    timestamp: new Date().toISOString(),
  });
});

// API routes with rate limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/me/password", passwordChangeLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/problem-types", problemTypeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
