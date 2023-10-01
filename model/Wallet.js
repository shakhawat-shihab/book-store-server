const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    balance: {
      type: Number,
    },
    statements: {
      type: [
        {
          transactionType: {
            type: String,
            enum: ["debit", "credit"],
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
          time: {
            type: Date,
          },
          _id: false,
        },
      ],
    },
  },
  { timestamps: true }
);

const WalletModel = mongoose.model("Wallet", walletSchema);
module.exports = WalletModel;
