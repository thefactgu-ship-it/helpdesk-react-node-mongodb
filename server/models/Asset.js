const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetName: {
      type: String,
      required: true,
      trim: true,
    },
    assetType: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
      trim: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    owner: {
      type: String,
      default: "",
      trim: true,
    },
    department: {
      type: String,
      default: "IT",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "In Repair", "Spare", "Retired"],
      default: "Active",
    },
    lifeCycle: {
      purchaseDate: {
        type: Date,
        default: null,
      },
      expectedLifeMonths: {
        type: Number,
        default: 36,
        min: 1,
      },
      condition: {
        type: String,
        enum: ["Good", "Monitor", "Needs Repair", "End of Life"],
        default: "Good",
      },
      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

assetSchema.index({ hotelId: 1, serialNumber: 1 }, { unique: true });
assetSchema.index({ hotelId: 1, createdAt: -1 });
assetSchema.index({ hotelId: 1, status: 1 });

module.exports = mongoose.model("Asset", assetSchema);
