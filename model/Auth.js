const mongoose = require("mongoose");

const authSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      maxLength: 12,
    },
    role: {
      type: Number,
      required: false,
      default: 2, // 2 means general user, 1 mean admin
    },
    verified: {
      type: Boolean,
      required: false,
      default: false,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const AuthModel = mongoose.model("Auth", authSchema);
module.exports = AuthModel;
