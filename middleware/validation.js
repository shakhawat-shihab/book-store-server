const { body, query, param } = require("express-validator");
const { isValidObjectId } = require("mongoose");

const authValidator = {
  signup: [
    body("userName")
      .exists()
      .withMessage("userName must be provided")
      .bail()
      .isString()
      .withMessage("user name must be a string")
      .bail()
      .matches(/^[a-zA-Z ]*$/)
      .withMessage("user name must be in only alphabets")
      .isLength({ min: 1, max: 12 })
      .withMessage("user name must be between 1 and 12 characters")
      .bail(),
    body("email")
      .exists()
      .withMessage("Email must be provided")
      .bail()
      .isString()
      .withMessage("Email must be a string")
      .bail()
      .isEmail()
      .withMessage("Email must be in valid format"),
    body("password")
      .exists()
      .withMessage("Password must be provided")
      .bail()
      .isString()
      .withMessage("Password must be a string")
      .bail()
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minSymbols: 1,
        minNumbers: 1,
      })
      .withMessage(
        "Password must contain at least 8 characters with 1 lower case, 1 upper case, 1 number, 1 symbol"
      ),
    body("confirmPassword")
      .exists()
      .withMessage("Password must be provided")
      .bail()
      .isString()
      .withMessage("Password must be a string")
      .bail()
      .custom((value, { req }) => {
        if (value === req.body.password) {
          return true;
        }
        throw new Error("Passwords do not match");
      }),
    body("phone")
      .exists()
      .withMessage("Phone number must be provided")
      .bail()
      .isString()
      .withMessage("Phone number must be a string")
      .bail()
      .matches(/(^(\+88|0088)?(01){1}[3456789]{1}(\d){8})$/)
      .withMessage("Phone number must be in a valid format"),
    // body("address.area")
    //   .exists()
    //   .withMessage("Area was not provided")
    //   .bail()
    //   .isString()
    //   .withMessage("Area must be a string"),
    // body("address.city")
    //   .exists()
    //   .withMessage("City was not provided")
    //   .bail()
    //   .isString()
    //   .withMessage("City must be a string"),
    // body("address.country")
    //   .exists()
    //   .withMessage("Country was not provided")
    //   .bail()
    //   .isString()
    //   .withMessage("Country must be a string"),
  ],
  login: [
    body("email").exists().withMessage("Email must be provided").bail(),
    body("password").exists().withMessage("Password must be provided").bail(),
  ],
};

const userValidator = {
  update: [
    body("firstName")
      .optional()
      // .exists()
      // .withMessage("first name name was not provided")
      // .bail()
      .notEmpty()
      .withMessage("first name cannot be empty")
      .bail()
      .isString()
      .withMessage("first name must be a string")
      .isLength({ max: 25 })
      .withMessage("first name cannot be more than 25 characters"),
    body("lastName")
      .optional()
      // .exists()
      // .withMessage("last name was not provided")
      // .bail()
      .notEmpty()
      .withMessage("last name cannot be empty")
      .bail()
      .isString()
      .withMessage("last name must be a string")
      .isLength({ max: 25 })
      .withMessage("last name cannot be more than 25 characters"),
    body("userName")
      .optional()
      // .exists()
      // .withMessage("user name was not provided")
      // .bail()
      .notEmpty()
      .withMessage("Name cannot be empty")
      .bail()
      .isString()
      .withMessage("Name must be a string")
      .isLength({ max: 12 })
      .withMessage("Name cannot be more than 12 characters"),
    body("phone")
      .optional()
      // .exists()
      // .withMessage("Phone number must be provided")
      // .bail()
      .isString()
      .withMessage("Phone number must be a string")
      .bail()
      .matches(/(^(\+88|0088)?(01){1}[3456789]{1}(\d){8})$/)
      .withMessage("Phone number must be in a valid format"),
    body("address")
      .optional()
      .isObject()
      .withMessage("Address should be object"),
    param("id")
      .exists()
      .withMessage("Customer ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
  ],
  delete: [
    param("customerId")
      .exists()
      .withMessage("Customer ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
  ],
};

const bookValidator = {
  add: [
    body("title")
      .exists()
      .withMessage("Book title must be provided")
      .bail()
      .isString()
      .withMessage("Book title must be a string")
      .bail()
      .isLength({ min: 10 })
      .withMessage("Book title must be at least 10 characters long"),
    body("isbn")
      .exists()
      .withMessage("Book isbn must be provided")
      .bail()
      .isNumeric()
      .withMessage("Book isbn must be a number")
      .bail()
      .isLength({ min: 13, max: 13 })
      .withMessage("Book isbn must be at least 13 characters long"),
    body("auhtor")
      .optional()
      //   .exists()
      //   .withMessage("author must be provided")
      //   .bail()
      .isString()
      .withMessage("Author description must be a string")
      .bail()
      .isLength({ max: 50 })
      .withMessage("Author must not greater than 50 characters long"),
    body("language")
      .exists()
      .withMessage("language must be provided")
      .bail()
      .isString()
      .withMessage("language must be a string"),
    body("pages")
      .exists()
      .withMessage("Pages must be provided")
      .bail()
      .isNumeric()
      .withMessage("Pages must be a number")
      .bail()
      .isInt({ min: 1 })
      .withMessage("Pages must be greater than 0"),
    body("year")
      .exists()
      .withMessage("Year must be provided")
      .bail()
      .isNumeric()
      .withMessage("Year must be a number")
      .bail()
      .isInt()
      .withMessage("Year must be integer"),
    body("price")
      .exists()
      .withMessage("Price must be provided")
      .bail()
      .isNumeric()
      .withMessage("Price must be a number")
      .bail()
      .isFloat({ min: 0 })
      .withMessage("Price must be greater than 0"),
    body("rating")
      .optional()
      //   .exists()
      //   .withMessage("rating must be provided")
      //   .bail()
      .isNumeric()
      .withMessage("rating must be a number")
      .bail()
      .isFloat({ min: 0, max: 5 })
      .withMessage("rating must be greater than 0 and less than 5"),
    body("stock")
      .exists()
      .withMessage("Stock must be provided")
      .bail()
      .isInt()
      .withMessage("Stock must be a number"),
  ],
  update: [
    body("title")
      .optional()
      .isString()
      .withMessage("Book title must be a string")
      .bail()
      .isLength({ min: 10 })
      .withMessage("Book title must be at least 10 characters long"),
    body("auhtor")
      .optional()
      .isString()
      .withMessage("Author description must be a string")
      .bail()
      .isLength({ max: 50 })
      .withMessage("Author must not greater than 50 characters long"),
    body("language")
      .optional()
      .isString()
      .withMessage("language must be a string"),
    body("pages")
      .optional()
      .isNumeric()
      .withMessage("Pages must be a number")
      .bail()
      .isInt({ min: 1 })
      .withMessage("Pages must be greater than 0"),
    body("year")
      .optional()
      .isNumeric()
      .withMessage("Year must be a number")
      .bail()
      .isInt()
      .withMessage("Year must be integer"),
    body("price")
      .optional()
      .isNumeric()
      .withMessage("Price must be a number")
      .bail()
      .isFloat({ min: 0 })
      .withMessage("Price must be greater than 0"),
    body("rating")
      .optional()
      .isNumeric()
      .withMessage("rating must be a number")
      .bail()
      .isFloat({ min: 0, max: 5 })
      .withMessage("rating must be greater than 0 and less than 5"),
    body("stock").optional().isInt().withMessage("Stock must be a number"),
    param("bookId")
      .exists()
      .withMessage("Book ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
  ],
  delete: [
    param("bookId")
      .exists()
      .withMessage("Book ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
  ],
};

const reviewValidator = {
  addReview: [
    body("userId")
      .exists()
      .withMessage("User ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
    body("bookId")
      .exists()
      .withMessage("Book ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
    body("content")
      .optional()
      // .withMessage("Review content must provide")
      // .bail()
      .isLength({ min: 5, max: 70 })
      .withMessage(
        "Review content must not less than 5 characters, and more than 70 characters"
      ),
    body("rating")
      .exists()
      // .withMessage("Rating must provide")
      // .bail()
      .isNumeric()
      .withMessage("Rating must be a number")
      .bail()
      .isFloat({ min: 0, max: 5 })
      .withMessage("Rating must be in between 0 and 5"),
  ],
  updateReview: [
    param("reviewId")
      .exists()
      .withMessage("Review ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
    body("content")
      .optional()
      .isLength({ min: 5, max: 70 })
      .withMessage(
        "Review content must not less than 5 characters, and more than 70 characters"
      ),
    body("rating")
      .optional()
      .isNumeric()
      .withMessage("Rating must be a number")
      .bail()
      .isFloat({ min: 0, max: 5 })
      .withMessage("Rating must be in between 0 and 5"),
  ],
  deleteReview: [
    param("reviewId")
      .exists()
      .withMessage("Review ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
  ],
};

const cartValidator = {
  addRemoveInCart: [
    body("userId")
      .exists()
      .withMessage("User ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
    body("bookId")
      .exists()
      .withMessage("Book ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
    body("amount")
      .exists()
      .withMessage("Book amont must be provided")
      .bail()
      .isInt({ min: 1 })
      .withMessage("Amount must be integer, value should be 1 or above"),
  ],
  getCartOfUser: [
    param("userId")
      .exists()
      .withMessage("user ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
  ],
};

const walletValidator = {
  addMoney: [
    body("amount")
      .exists()
      .withMessage("Book amont must be provided")
      .bail()
      .isFloat({ min: 100, max: 2000 })
      .withMessage(
        "Amount must be integer, value should be greater than 100 and less than 2000"
      ),
    body("userId")
      .exists()
      .withMessage("User ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
  ],
};

const discountValidator = {
  addDiscount: [
    body("title")
      .exists()
      .withMessage("Title must be provided")
      .bail()
      .isString()
      .withMessage("Title must be string"),
    body("startTime")
      .exists()
      .withMessage("Start time must be provided")
      .bail()
      // .isDate()
      // .withMessage("Start time must be a date")
      .isISO8601()
      .toDate()
      .withMessage("Invalid day received"),
    body("endTime")
      .exists()
      .withMessage("End time must be provided")
      .bail()
      // .isDate()
      // .withMessage("End time must be a date")
      .isISO8601()
      .toDate()
      .withMessage("Invalid day received"),
    // .custom((value, { req }) => {
    //   if (value > req.body.startTime) {
    //     return true;
    //   }
    //   throw new Error("End Date must be greater than start date");
    // }),
    body("discountPercentage")
      .exists()
      .withMessage("discount must be provided")
      .bail()
      .isFloat({ min: 0, max: 100 })
      .withMessage("discount percentage in between 0 to 100"),
  ],
  updateDiscount: [
    body("title").optional().isString().withMessage("Title must be string"),
    body("startTime")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Invalid day received"),
    body("endTime")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Invalid day received")
      .custom((value, { req }) => {
        if (value > req.body.startTime) {
          return true;
        }
        throw new Error("End Date must be greater than start date");
      }),
    body("discountPercentage")
      .exists()
      .withMessage("discount must be provided")
      .bail()
      .isFloat({ min: 0, max: 100 })
      .withMessage("discount percentage in between 0 to 100"),
    param("discountId")
      .exists()
      .withMessage("ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
  ],
};

const transactionValidator = {
  transactionCheckout: [
    body("userId")
      .exists()
      .withMessage("User ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
    body("cartId")
      .exists()
      .withMessage("Book ID must be provided")
      .bail()
      .matches(/^[a-f\d]{24}$/i)
      .withMessage("ID is not in valid mongoDB format"),
  ],
};

module.exports = {
  userValidator,
  authValidator,
  bookValidator,
  cartValidator,
  reviewValidator,
  walletValidator,
  discountValidator,
  transactionValidator,
};
