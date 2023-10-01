const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    books: {
      type: [
        {
          book: {
            type: mongoose.Types.ObjectId,
            ref: "Book",
            required: true,
          },
          quantity: Number,
          _id: false,
        },
      ],
    },
    // total: { type: Number, required: true },
  },
  { timestamps: true }
);

const CartModel = mongoose.model("Cart", cartSchema);
module.exports = CartModel;
