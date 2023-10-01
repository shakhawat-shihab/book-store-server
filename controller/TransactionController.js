const TransactionModel = require("../model/Transaction");
const CartModel = require("../model/Cart");
const BookModel = require("../model/Book");
const HTTP_STATUS = require("../constants/statusCodes");
const { sendResponse } = require("../utils/common");
const UserModel = require("../model/User");
const WalletModel = require("../model/wallet");
const { insertInLog } = require("../server/logFile");
const { validationResult } = require("express-validator");

class TransactionController {
  async getAll(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.params, req.body);
      const { page = 1, limit } = req.query;
      const { detail } = req.query;
      let transactions;
      if (detail && detail != "1") {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Invalid parameter sent"
        );
      }

      if (detail === "1") {
        transactions = await TransactionModel.find({})
          .populate("user", "userName email")
          .select("total paymentMethod user books")
          .populate("books.book", "title author rating language category")
          .select("-__v -craetedAt -updatedAt")
          .skip((page - 1) * limit)
          .limit(limit ? limit : 100);
      } else {
        transactions = await TransactionModel.find({})
          .populate("user", "userName email")
          .skip((page - 1) * limit)
          .limit(limit ? limit : 100);
      }
      const transactionCount = await TransactionModel.find().count();

      if (transactions.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.OK,
          "Successfully received all transactions",
          {
            totalTransaction: transactionCount,
            count: transactions.length,
            page: parseInt(page),
            limit: parseInt(limit),
            transactions: transactions,
          }
        );
      }
      return sendResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        "No transactions were found"
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

  async getMyTansaction(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.params, req.body);
      // const validation = validationResult(req).array();
      // if (validation.length > 0) {
      //   return sendResponse(
      //     res,
      //     HTTP_STATUS.UNPROCESSABLE_ENTITY,
      //     "Failed to add the Book",
      //     validation
      //   );
      // }

      const { userId } = req.body;
      let transaction = await TransactionModel.find({ user: userId })
        .populate("user", "name email")
        .populate("books.book", "title author price rating language category")
        .select("-__v");

      if (transaction.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.OK,
          "Transaction details is returned",
          transaction
        );
      } else {
        return sendResponse(
          res,
          HTTP_STATUS.NOT_FOUND,
          "No transactions were found"
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

  async create(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.params, req.body);
      const validation = validationResult(req).array();
      if (validation.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Failed to add the Book",
          validation
        );
      }

      const { userId, cartId } = req.body;

      const user = await UserModel.findOne({ _id: userId }).populate("wallet");

      if (!user) {
        return sendResponse(res, HTTP_STATUS.NOT_FOUND, "User not found");
      }

      let cart = await CartModel.findOne({ _id: cartId, user: userId }).select(
        "-createdAt -updatedAt -__v"
      );

      if (!cart) {
        return sendResponse(
          res,
          HTTP_STATUS.NOT_FOUND,
          "Cart was not found for this user"
        );
      }

      if (!cart?.books?.length) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Cart has no book added"
        );
      }

      //   console.log(cart);
      const bookList = cart?.books?.map((element) => {
        return element.book;
      });

      const booksInCart = await BookModel.find({
        _id: {
          $in: bookList,
        },
      })
        .populate("discounts", " -books -createdAt -updatedAt  -__v ")
        .select("price _id title");

      if (bookList?.length !== booksInCart?.length) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "All books in cart do not exist"
        );
      }

      booksInCart.forEach((book) => {
        const bookFound = cart.books.findIndex(
          (cartItem) => String(cartItem.book._id) === String(book._id)
        );
        if (book.stock < cart.books[bookFound].quantity) {
          return sendResponse(
            res,
            HTTP_STATUS.NOT_FOUND,
            "Unable to check out at this time, book does not exist"
          );
        }
        book.stock -= cart.books[bookFound].quantity;
      });

      let currentTime = new Date();
      let priceObj = {};

      booksInCart.map((book) => {
        //discounts map
        let discountSum = book?.discounts?.reduce((total, discount) => {
          if (
            discount?.startTime <= currentTime &&
            currentTime <= discount?.endTime
          ) {
            return total + discount?.discountPercentage;
          }
          return total;
        }, 0);
        // console.log(discountSum);
        // discouunt 100 er besi hole sei product dekhano jabe na
        if (discountSum <= 100) {
          book.price = Number(
            (book.price - book.price * (discountSum / 100)).toFixed(2)
          );
          let subObj = { price: book.price };
          priceObj[`${book._id}`] = subObj;
        }
      });

      let myCart = cart;
      myCart = myCart.toObject();

      // console.log(myCart);
      let totalPrice = 0;
      let priceAddedBooks = myCart?.books?.filter((x) => {
        let id = x?.book?._id;
        // console.log(x);
        x.price = priceObj[`${id}`]?.price;
        totalPrice += (x?.price || 0) * x?.quantity;
        if (x?.price != undefined) {
          return x;
        }
      });
      console.log("priceAddedBooks ", priceAddedBooks);

      // update walllet,,,
      // console.log(user?.wallet?.balance, totalPrice);
      if (user?.wallet?.balance && user?.wallet?.balance >= totalPrice) {
        let { balance = 0 } = user?.wallet;
        balance = Number((balance - totalPrice).toFixed(2));
        const obj = {
          transactionType: "debit",
          amount: totalPrice,
          time: new Date(),
        };
        const walletUpdate = await WalletModel.updateOne(
          { _id: user?.wallet?._id },
          { $set: { balance: balance }, $push: { statements: obj } }
        );
      } else {
        return sendResponse(
          res,
          HTTP_STATUS.PAYMENT_REQUIRED,
          "Insuffiecient balance"
        );
      }

      const bulk = [];
      booksInCart.map((element) => {
        bulk.push({
          updateOne: {
            filter: { _id: element },
            update: { $set: { stock: element.stock } },
          },
        });
      });

      const stockSave = await BookModel.bulkWrite(bulk);
      let newTransaction = await TransactionModel.create({
        books: priceAddedBooks,
        user: userId,
        total: totalPrice,
      });

      newTransaction = newTransaction?.toObject();
      delete newTransaction?.createdAt;
      delete newTransaction?.updatedAt;
      delete newTransaction?.__v;

      cart.books = [];
      cart.total = 0;
      const cartSave = await cart.save();

      if (cartSave && stockSave && newTransaction) {
        return sendResponse(
          res,
          HTTP_STATUS.OK,
          "Successfully checked out!",
          newTransaction
        );
      }

      return sendResponse(
        res,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
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

module.exports = new TransactionController();
