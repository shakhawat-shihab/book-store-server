const { validationResult } = require("express-validator");
const HTTP_STATUS = require("../constants/statusCodes");
const ReviewModel = require("../model/Review");
const BookModel = require("../model/Book");
const { sendResponse } = require("../utils/common");
const { insertInLog } = require("../server/logFile");

class ReviewController {
  async create(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.params, req.body);
      // express validator
      const validation = validationResult(req).array();
      if (validation.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Failed to add the review",
          validation
        );
      }
      let { userId, bookId, content, rating } = req.body;

      //check if the review already exist
      const existReview = await ReviewModel.findOne({ userId, bookId });
      if (existReview) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "You have already reviewd. Now you may modify your review"
        );
      }

      //check if the product exist
      const book = await BookModel.findOne({ _id: bookId });
      if (!book) {
        return sendResponse(res, HTTP_STATUS.NOT_FOUND, "Book is not exist");
      }

      // creating review
      let review = new ReviewModel({
        userId,
        bookId,
        content,
        rating,
      });
      let newReview = await review.save();

      // if review is created then update rating and reviewCount
      if (newReview?._id) {
        // console.log(newReview);
        let { rating: previousRating = 0, reviewCount = 0 } = book;
        rating = Number(
          (
            (previousRating * reviewCount + parseFloat(rating)) /
            (reviewCount + 1)
          ).toFixed(2)
        );
        reviewCount++;

        let bookUpdate = await BookModel.updateOne(
          { _id: bookId },
          { $set: { reviewCount, rating }, $push: { reviews: newReview?._id } }
        );

        if (bookUpdate) {
          newReview = newReview.toObject();
          delete newReview?.createdAt;
          delete newReview?.updatedAt;
          delete newReview?.__v;
          return sendResponse(
            res,
            HTTP_STATUS.OK,
            "Successfully added review",
            newReview
          );
        }

        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Something went wrong"
        );
      }
    } catch (error) {
      console.log(error);
      return sendResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async update(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.params, req.body);
      // express validator
      const validation = validationResult(req).array();
      if (validation.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Failed to update review",
          validation
        );
      }

      let { content, rating, userId } = req.body;

      let { reviewId } = req.params;
      console.log(reviewId, content, rating);

      //check if the review  exist
      const existReview = await ReviewModel.findOne({ _id: reviewId });
      if (!existReview) {
        return sendResponse(
          res,
          HTTP_STATUS.NOT_FOUND,
          "This review doesn't exist"
        );
      }

      //check if the review is accessible to the  user
      // console.log("userId ", userId);
      if (existReview?.userId != userId) {
        return sendResponse(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          "This review is not accessible by you"
        );
      }

      //check if the book exist
      const book = await BookModel.findOne({ _id: existReview?.bookId });
      if (!book) {
        return sendResponse(res, HTTP_STATUS.NOT_FOUND, "Book is not exist");
      }

      let reviewUpdate;

      if (!rating && !content) {
        console.log("delete");
        reviewUpdate = await ReviewModel.deleteOne({ _id: reviewId });

        let previousRating = existReview.rating || 0;
        let { rating: currrentRatingOfBook, reviewCount } = book;

        let newRating = Number(
          (
            (currrentRatingOfBook * reviewCount - previousRating) /
            (reviewCount - 1)
          ).toFixed(2)
        );
        let newReviewCount = reviewCount - 1;
        console.log(newRating, " && ", newReviewCount);

        let updatedBook = await BookModel.updateOne(
          { _id: book?._id },
          {
            $set: {
              rating: newRating,
              reviewCount: newReviewCount,
            },
            $pull: {
              reviews: reviewId,
            },
          }
        );
        if (updatedBook)
          return sendResponse(
            res,
            HTTP_STATUS.OK,
            "Successfully deleted the review"
          );
      } else if (rating == undefined && content) {
        console.log("content");
        reviewUpdate = await ReviewModel.updateOne(
          { _id: reviewId },
          { $set: { content: content }, $unset: { rating: "" } }
        );
      } else if (content == undefined && rating) {
        console.log("rating");
        reviewUpdate = await ReviewModel.updateOne(
          { _id: reviewId },
          { $set: { rating: rating }, $unset: { content: "" } }
        );
      } else {
        console.log("content and rating");
        reviewUpdate = await ReviewModel.updateOne(
          { _id: reviewId },
          { $set: { rating: rating, content: content } }
        );
      }
      // console.log(reviewUpdate);

      let { rating: currrentRatingOfBook, reviewCount } = book;
      // rating is not provided by user,
      if (rating == undefined) {
        let previousRating = existReview.rating || 0;
        // take pervious rating of that review and update both reviewCount & rating in book
        book.rating = Number(
          (
            (currrentRatingOfBook * reviewCount - previousRating) /
            (reviewCount - 1)
          ).toFixed(2)
        );
        // console.log("book.rating ", typeof book.rating);
        book.reviewCount = reviewCount - 1;
      }
      // rating is provided by user,
      else {
        // take pervious rating of that review and both rating in book
        rating = parseFloat(rating);
        console.log(currrentRatingOfBook, reviewCount, rating);
        let previousRating = existReview.rating;
        // if review has no rating previously, then review count should be increased
        if (previousRating == undefined) {
          book.rating = Number(
            (
              (currrentRatingOfBook * reviewCount + rating) /
              (reviewCount + 1)
            ).toFixed(2)
          );
          book.reviewCount = reviewCount + 1;
        }
        // if review has rating previously, then review count should not be increased
        else {
          book.rating = Number(
            (
              (currrentRatingOfBook * reviewCount + (rating - previousRating)) /
              reviewCount
            ).toFixed(2)
          );
        }
      }
      let result = await book.save({ validateBeforeSave: false });

      if (result)
        return sendResponse(
          res,
          HTTP_STATUS.OK,
          "Successfully updated the review"
        );
    } catch (error) {
      console.log(error);
      return sendResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async delete(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.params, req.body);
      // express validator
      const validation = validationResult(req).array();
      if (validation.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Failed to update review",
          validation
        );
      }

      let { userId } = req.body;
      let { reviewId } = req.params;

      //check if the review  exist
      const existReview = await ReviewModel.findOne({ _id: reviewId });
      if (!existReview) {
        return sendResponse(
          res,
          HTTP_STATUS.NOT_FOUND,
          "This review doesn't exist"
        );
      }

      //check if the book exist
      const book = await BookModel.findOne({ _id: existReview?.bookId });
      if (!book) {
        return sendResponse(res, HTTP_STATUS.NOT_FOUND, "Book is not exist");
      }

      //check if the review is accessible to the  user
      // console.log("userId ", userId);
      if (existReview?.userId != userId) {
        return sendResponse(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          "This review is not accessible by you"
        );
      }

      // console.log("delete ", reviewId);
      let reviewUpdate = await ReviewModel.deleteOne({ _id: reviewId });

      let previousRating = existReview.rating || 0;
      let { rating: currrentRatingOfBook, reviewCount } = book;

      let newRating = Number(
        (
          (currrentRatingOfBook * reviewCount - previousRating) /
          (reviewCount - 1)
        ).toFixed(2)
      );
      let newReviewCount = reviewCount - 1;
      // console.log(newRating, " && ", newReviewCount);

      let updatedBook = await BookModel.updateOne(
        { _id: book?._id },
        {
          $set: {
            rating: newRating,
            reviewCount: newReviewCount,
          },
          $pull: {
            reviews: reviewId,
          },
        }
      );

      if (updatedBook && reviewUpdate) {
        return sendResponse(
          res,
          HTTP_STATUS.OK,
          "Successfully deleted the review"
        );
      }

      return sendResponse(
        res,
        HTTP_STATUS.UNAVAILABLE_FOR_LEGAL_REASONS,
        "Something went wrong"
      );
    } catch (error) {
      console.log(error);
      return sendResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
}

module.exports = new ReviewController();
