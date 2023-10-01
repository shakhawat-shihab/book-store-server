const { validationResult } = require("express-validator");
const HTTP_STATUS = require("../constants/statusCodes");
const CartModel = require("../model/Cart");
const BookModel = require("../model/Book");
const UserModel = require("../model/User");
const { sendResponse } = require("../utils/common");
const { insertInLog } = require("../server/logFile");

class CartController {
  async getCart(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.params, req.body);
      const { userId } = req.params;
      const user = await UserModel.findById({ _id: userId });
      if (!user) {
        return sendResponse(res, HTTP_STATUS.NOT_FOUND, "User does not exist");
      }
      let cart = await CartModel.findOne({ user: userId }).populate(
        "books.book",
        "isbn title author year language stock rating reviewCount "
      );

      if (!cart) {
        return sendResponse(
          res,
          HTTP_STATUS.NOT_FOUND,
          "Cart does not exist for user"
        );
      }

      const bookList = cart?.books?.map((x) => {
        return x.book;
      });
      const booksInCart = await BookModel.find({
        _id: {
          $in: bookList,
        },
      })
        .populate("discounts", " -books -createdAt -updatedAt  -__v ")
        .select("price _id title");

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
        // discouunt 100 er besi hole sei product dekhano jabe na
        if (discountSum <= 100) {
          book.price = Number(
            (book.price - book.price * (discountSum / 100)).toFixed(2)
          );
          let subObj = { price: book.price };
          priceObj[`${book._id}`] = subObj;
        }
      });
      // console.log("priceObj ", priceObj);
      cart = cart.toObject();
      let totalPrice = 0;
      let priceAddedBooks = cart?.books?.map((x) => {
        let id = x?.book?._id;
        // console.log(x);
        x.price = priceObj[`${id}`]?.price;
        totalPrice += (x?.price || 0) * x?.quantity;
        if (x?.price != undefined) {
          return x;
        }
      });

      // console.log(priceAddedBooks);
      cart.books = priceAddedBooks;
      cart.totalPrice = Number(totalPrice.toFixed(2));
      delete cart.createdAt;
      delete cart.updatedAt;
      delete cart.__v;

      return sendResponse(
        res,
        HTTP_STATUS.OK,
        "Successfully got cart for user",
        cart
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

  async addBookToCart(req, res) {
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

      let { userId, bookId, amount } = req.body;
      amount = parseInt(amount);

      const user = await UserModel.findById({ _id: userId });
      //check if user exist
      if (!user) {
        return sendResponse(res, HTTP_STATUS.NOT_FOUND, "User does not exist");
      }

      let cart = await CartModel.findOne({ user: userId });
      const book = await BookModel.findById({ _id: bookId })
        .populate("discounts", " -books -createdAt -updatedAt  -__v ")
        .select("-createdAt -updatedAt -__v");

      //check if book exist
      if (!book) {
        return sendResponse(
          res,
          HTTP_STATUS.NOT_FOUND,
          "Book with ID was not found"
        );
      }

      // console.log(book?.discounts);
      let currentTime = new Date();
      console.log(currentTime);
      let discountSum = book?.discounts?.reduce((total, discount) => {
        if (
          discount?.startTime <= currentTime &&
          currentTime <= discount?.endTime
        ) {
          return total + discount?.discountPercentage;
        }
        return total;
      }, 0);

      // console.log(book.price);
      // console.log("discountSum ", discountSum);
      if (discountSum <= 100) {
        book.price = Number(
          (book.price - book.price * (discountSum / 100)).toFixed(2)
        );
      } else {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Sorry book is not available"
        );
      }

      if (book.stock < amount) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Not enough Books are in stock"
        );
      }

      if (!cart) {
        // console.log("cart ", cart);
        let newCart = await CartModel.create({
          user: userId,
          books: [{ book: bookId, quantity: amount }],
        });
        // console.log("newCart ", newCart);
        newCart = newCart.toObject();
        newCart.books[0].price = book.price;
        // console.log("book.price ", book.price);
        // newCart.total = book.price * amount;
        if (newCart) {
          return sendResponse(
            res,
            HTTP_STATUS.OK,
            "Added item to a new cart",
            newCart
          );
        }
      }

      const bookIndex = cart?.books?.findIndex(
        (element) => String(element.book) === bookId
      );

      if (bookIndex !== -1) {
        if (book.stock < cart?.books[bookIndex]?.quantity + amount) {
          return sendResponse(
            res,
            HTTP_STATUS.UNPROCESSABLE_ENTITY,
            "Not enough Books are in stock"
          );
        }
        cart.books[bookIndex].quantity += amount;
      } else {
        cart.books.push({ book: bookId, quantity: amount });
      }

      await cart.save();
      // console.log("cart ", cart);
      // let quantity = {};
      const bookList = cart?.books?.map((x) => {
        // console.log("x ", x);
        // let subObj = { quantity: x.quantity };
        // quantity[`${x?.book._id}`] = subObj;
        return x.book;
      });
      // console.log("quantity ", quantity);

      //find all the books that are in the cart
      const booksInCart = await BookModel.find({
        _id: {
          $in: bookList,
        },
      })
        .populate("discounts", " -books -createdAt -updatedAt  -__v ")
        .select("price _id title");

      // console.log(booksInCart);
      let priceObj = {};
      //books map
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
        // discouunt 100 er besi hole sei product dekhano jabe na
        if (discountSum <= 100) {
          book.price = Number(
            (book.price - book.price * (discountSum / 100)).toFixed(2)
          );
          let subObj = { price: book.price };
          priceObj[`${book._id}`] = subObj;
          // return obj;
        }
      });
      // console.log("priceObj ", priceObj);
      cart = cart.toObject();
      // console.log(cart);
      let totalPrice = 0;
      let priceAddedBooks = cart?.books?.map((x) => {
        let id = x.book;
        // console.log("my ", price[`${id}`].price);
        x.price = priceObj[`${id}`]?.price;
        totalPrice += (x?.price || 0) * x?.quantity;
        if (x?.price != undefined) {
          return x;
        }
      });

      console.log(priceAddedBooks);
      cart.books = priceAddedBooks;
      cart.totalPrice = Number(totalPrice.toFixed(2));
      delete cart.createdAt;
      delete cart.updatedAt;
      delete cart.__v;

      return sendResponse(
        res,
        HTTP_STATUS.CREATED,
        "Added item to existing cart",
        cart
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

  async removeBookFromCart(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.params, req.body);
      const validation = validationResult(req).array();
      if (validation.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Failed to remove the Book",
          validation
        );
      }

      let { userId, bookId, amount } = req.body;
      amount = parseInt(amount);

      const user = await UserModel.findById({ _id: userId });
      //check if user exist
      if (!user) {
        return sendResponse(res, HTTP_STATUS.NOT_FOUND, "User does not exist");
      }

      let cart = await CartModel.findOne({ user: userId });

      if (!cart) {
        return sendResponse(
          res,
          HTTP_STATUS.NOT_FOUND,
          "Cart was not found for this user"
        );
      }

      const book = await BookModel.findById({ _id: bookId })
        .populate("discounts", " -books -createdAt -updatedAt  -__v ")
        .select("-createdAt -updatedAt -__v");

      if (!book) {
        return sendResponse(
          res,
          HTTP_STATUS.NOT_FOUND,
          "Book with ID was not found"
        );
      }

      const bookExistIntex = cart.books.findIndex(
        (element) => String(element.book) === bookId
      );

      if (bookExistIntex === -1) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Book was not found in cart"
        );
      }

      //  trying to order more book greater than stock
      if (cart.books[bookExistIntex].quantity < amount) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Book does not exist in the cart enough times"
        );
      }

      // console.log(cart.books[bookExistIntex]);
      //  trying to order  book equal to stock
      if (cart.books[bookExistIntex]?.quantity >= amount) {
        // console.log(cart.books[bookExistIntex]);
        cart.books[bookExistIntex].quantity =
          cart.books[bookExistIntex].quantity - amount;
        if (cart.books[bookExistIntex].quantity == 0) {
          // console.log("here 1", cart.books[bookExistIntex]);
          cart.books.splice(bookExistIntex, 1);
          // console.log("here 2", cart.books[bookExistIntex]);
        }
        await cart.save();
        const bookList = cart?.books?.map((x) => {
          return x.book;
        });
        const booksInCart = await BookModel.find({
          _id: {
            $in: bookList,
          },
        })
          .populate("discounts", " -books -createdAt -updatedAt  -__v ")
          .select("price _id title");

        let priceObj = {};
        let currentTime = new Date();
        //books map
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
          // discouunt 100 er besi hole sei product dekhano jabe na
          if (discountSum <= 100) {
            book.price = Number(
              (book.price - book.price * (discountSum / 100)).toFixed(2)
            );
            let subObj = { price: book.price };
            priceObj[`${book._id}`] = subObj;
            // return obj;
          }
        });
        // console.log("priceObj ", priceObj);
        cart = cart.toObject();
        let totalPrice = 0;
        let priceAddedBooks = cart?.books?.filter((x) => {
          let id = x.book;
          // console.log("my ", priceObj[`${id}`].price);
          x.price = priceObj[`${id}`]?.price;
          totalPrice += (x?.price || 0) * x?.quantity;
          if (x?.price != undefined) {
            return x;
          }
        });

        console.log("priceAddedBooks ", priceAddedBooks);
        cart.books = priceAddedBooks;
        cart.totalPrice = Number(totalPrice.toFixed(2));
        delete cart.createdAt;
        delete cart.updatedAt;
        delete cart.__v;

        return sendResponse(
          res,
          HTTP_STATUS.OK,
          "Book removed from cart",
          cart
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
}

module.exports = new CartController();
