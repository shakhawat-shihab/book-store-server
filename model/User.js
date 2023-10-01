const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      maxLength: 25,
    },
    lastName: {
      type: String,
      maxLength: 25,
    },
    userName: {
      type: String,
      required: true,
      maxLength: 12,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    wallet: {
      type: mongoose.Types.ObjectId,
      ref: "Wallet",
    },
    address: {
      house: String,
      road: String,
      area: {
        type: String,
      },
      city: {
        type: String,
      },
      country: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
module.exports = UserModel;
