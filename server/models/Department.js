const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
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
    active: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true }
);

departmentSchema.index({ hotelId: 1, name: 1 }, { unique: true });
departmentSchema.index({ hotelId: 1, code: 1 }, { unique: true });
departmentSchema.index({ hotelId: 1, active: 1, sortOrder: 1 });

module.exports = mongoose.model("Department", departmentSchema);
