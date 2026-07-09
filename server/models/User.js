const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    authProvider: {
      type: String,
      enum: ["password", "google"],
      default: "password",
    },
    googleSub: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required() {
        return this.authProvider !== "google";
      },
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["GroupAdmin", "RegionalManager", "HotelAdmin", "Admin", "Manager", "Agent", "User"],
      default: "User",
    },
    team: {
      type: String,
      default: "Support",
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    departmentName: {
      type: String,
      trim: true,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      default: null,
    },
    hotelAccess: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
      },
    ],
    regions: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

userSchema.index({ email: 1, hotelId: 1 }, { unique: true });
userSchema.index({ googleSub: 1 }, { unique: true, sparse: true });
userSchema.index({ hotelId: 1, role: 1 });
userSchema.index({ hotelId: 1, departmentId: 1 });

module.exports = mongoose.model("User", userSchema);
