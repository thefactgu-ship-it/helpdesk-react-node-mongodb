const mongoose = require("mongoose");

const problemTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

problemTypeSchema.index({ name: 1 }, { unique: true });
problemTypeSchema.index({ active: 1 });

module.exports = mongoose.model("ProblemType", problemTypeSchema);
