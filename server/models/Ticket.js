const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    requester: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "General",
    },

    department: {
      type: String,
      default: "IT",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    slaHours: {
      type: Number,
      default: 24,
    },

    dueDate: {
      type: Date,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    activityLog: [
      {
        action: {
          type: String,
          required: true,
        },
        details: {
          type: String,
          default: "",
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    comments: [
      {
        text: {
          type: String,
          required: true,
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

ticketSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate) return false;
  if (["resolved", "closed"].includes(this.status)) return false;

  return new Date() > this.dueDate;
});

ticketSchema.set("toJSON", { virtuals: true });
ticketSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Ticket", ticketSchema);
