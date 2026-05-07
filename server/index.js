const express = require("express");
const mongoose = require("mongoose");
const ticketRoutes = require("./routes/ticketRoutes");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

async function ensureAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@test.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "123456";
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

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await ensureAdminUser();
  })
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("HelpDesk API Running");
});

app.use("/api/tickets", ticketRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
