const express = require("express");
const routes = express();
const TransactionController = require("../controller/TransactionController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { transactionValidator } = require("../middleware/validation");

routes.get("/all", isAuthenticated, isAdmin, TransactionController.getAll);

routes.get(
  "/my-transaction",
  isAuthenticated,
  TransactionController.getMyTansaction
);

routes.post(
  "/checkout",
  // isAuthenticated,
  transactionValidator.transactionCheckout,
  TransactionController.create
);

module.exports = routes;
