const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: "first name is required",
    },
    lastName: {
      type: String,
      trim: true,
      required: "last name is required",
    },
    phone: {
      type: String,
      trim: true,
      unique: "Phone number already exists",
      required: "phone number is required",
    },
    city: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: "Email already exists",
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
      required: "Email is required",
    },
    gender: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      required: "Country is required",
    },
    state: {
      type: String,
      trim: true,
      required: "State is required",
    },
    password: {
      type: String,
      required: "Password is required",
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
    },
    exams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
      },
    ],
    examsCompleted: {
      type: Number,
      default: 0,
    },
    examsScheduled: {
      type: Number,
      default: 0,
    },
    numberOfCandidates: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["Admin", "User"],
      default: "User",
    },
    voucherQty: {
      type: Number,
      default: 10,
    },
    voucherUsed: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
      default: "adminPhoto.jpg",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
