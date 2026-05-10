const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");

// Import routes
const ticketRoutes = require("./routes/ticketRoutes");
const authRoutes = require("./routes/authRoutes");
const assetRoutes = require("./routes/assetRoutes");
const problemTypeRoutes = require("./routes/problemTypeRoutes");

// Import models
const User = require("./models/User");

// Import middleware
const errorHandler = require("./middleware/errorHandler");
const validateEnv = require("./middleware/envValidator");

require("dotenv").config();

// Validate environment variables on startup
validateEnv();

const app = express();

// Security middleware
app.use(helmet()); // Set security headers
// Note: NoSQL injection is prevented through:
// 1. Input validation with express-validator
// 2. Mongoose schema enforcement
// 3. Avoid using MongoDB operators directly from request data

// CORS configuration - restrict to allowed origins
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173", // Vite default port
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Uploaded files are served through protected ticket attachment routes.

// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 5 : 20,
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

async function ensureAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@test.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMeNow!2026";
  const adminName = process.env.ADMIN_NAME || "System Admin";

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    if (existingAdmin.role !== "Admin") {
      existingAdmin.role = "Admin";
      existingAdmin.team = existingAdmin.team || "System";
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
    role: "Admin",
    team: "System",
  });

  console.log(`Default admin created: ${adminEmail}`);
}

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await ensureAdminUser();
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "HelpDesk API Running", status: "ok" });
});

// API routes with rate limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
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
