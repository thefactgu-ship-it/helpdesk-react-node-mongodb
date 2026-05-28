const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
    },

    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
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

    requesterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    category: {
      type: String,
      default: "General",
    },

    department: {
      type: String,
      default: "IT",
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

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    visibility: {
      type: String,
      enum: ["normal", "private"],
      default: "normal",
      index: true,
    },

    criticalRequested: {
      type: Boolean,
      default: false,
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

    satisfactionScore: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    satisfactionComment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    satisfactionSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    satisfactionSubmittedAt: {
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
        storageProvider: {
          type: String,
          enum: ["local", "s3"],
          default: "local",
        },
        objectKey: {
          type: String,
          default: "",
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

ticketSchema.index({ hotelId: 1, createdAt: -1 });
ticketSchema.index({ hotelId: 1, status: 1, createdAt: -1 });
ticketSchema.index({ hotelId: 1, assignedTo: 1, createdAt: -1 });
ticketSchema.index({ hotelId: 1, createdBy: 1, createdAt: -1 });
ticketSchema.index({ hotelId: 1, requesterUserId: 1, createdAt: -1 });
ticketSchema.index({ hotelId: 1, departmentId: 1, createdAt: -1 });
ticketSchema.index({ hotelId: 1, visibility: 1, departmentId: 1, createdAt: -1 });
ticketSchema.index({ hotelId: 1, category: 1, createdAt: -1 });

ticketSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate) return false;
  if (["resolved", "closed"].includes(this.status)) return false;

  return new Date() > this.dueDate;
});

ticketSchema.set("toJSON", { virtuals: true });
ticketSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Ticket", ticketSchema);
