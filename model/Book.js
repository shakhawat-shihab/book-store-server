const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
      default: "Unknown",
    },
    title: {
      type: String,
      required: true,
    },
    isbn: {
      type: String,
      required: true,
    },
    country: {
      type: String,
    },
    imageLink: {
      type: String,
    },
    language: {
      type: String,
      requied: true,
    },
    link: {
      type: String,
    },
    pages: {
      type: Number,
      requied: true,
    },
    year: {
      type: Number,
      required: false,
    },
    price: {
      type: Number,
      required: [true, "Every book should have a price"],
    },
    rating: {
      type: Number,
      required: false,
      // min: 0,
      // max: 5,
      // default: 0,
    },
    reviewCount: {
      type: Number,
      required: false,
    },
    category: {
      type: [String],
      required: false,
      default: [],
    },
    stock: {
      type: Number,
      required: false,
    },
    reviews: {
      type: [mongoose.Types.ObjectId],
      ref: "Review",
    },
    discounts: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Discount",
      },
    ],
    images: [String],
    views: {
      type: Number,
    },
  },
  { timestamps: true }
);

const BookModel = mongoose.model("Book", bookSchema);
module.exports = BookModel;
