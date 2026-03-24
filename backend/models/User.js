const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profileImage: {
      type: String,
      default: "",
    },
    degree: {
      type: String,
      default: "",
    },
    year: {
      type: String,
      default: "",
    },
    subjects: {
      type: [String],
      default: [],
    },
    availableTime: [{
      day: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      },
      startTime: {
        type: String, // "10:00" format
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please provide a valid time in HH:mm format"],
      },
      endTime: {
        type: String, // "12:00" format
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please provide a valid time in HH:mm format"],
      },
    }],
    studyGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StudyGroup",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
