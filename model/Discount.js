const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Discount must have a title"],
    },
    startTime: {
      type: Date,
      required: [true, "Discount must have a start time"],
    },
    endTime: {
      type: Date,
      required: [true, "Discount must have a end time"],
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      required: [true, "Every discount should have a value"],
    },
    books: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Book",
      },
    ],
  },
  { timestamps: true }
);

const DiscountModel = mongoose.model("Discount", discountSchema);
module.exports = DiscountModel;
