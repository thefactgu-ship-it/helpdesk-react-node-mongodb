const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    region: {
      type: String,
      default: "Default",
      trim: true,
    },
    timezone: {
      type: String,
      default: "Asia/Bangkok",
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

hotelSchema.index({ code: 1 }, { unique: true });
hotelSchema.index({ region: 1, active: 1 });

module.exports = mongoose.model("Hotel", hotelSchema);
