const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      trim: true,
      required: "otp is required",
    },
    type: {
      type: String,
      enum: ["password", "email"],
      trim: true,
      required: "type is required",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: "user is required",
    },
    valid: {
      type: Boolean,
      default: true,
    },
    expiry: {
      type: Date,
      default: new Date(),
      expires: 900,
    },
  },
  {
    timestamps: true,
  }
);
const Otp = mongoose.model("Otp", OtpSchema);

module.exports = Otp;
