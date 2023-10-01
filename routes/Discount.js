const express = require("express");
const routes = express();
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const DiscountController = require("../controller/DiscountController");
const { discountValidator } = require("../middleware/validation");

routes.post(
  "/create",
  isAuthenticated,
  isAdmin,
  discountValidator.addDiscount,
  DiscountController.createDiscount
);

routes.patch(
  "/update/:discountId",
  isAuthenticated,
  isAdmin,
  discountValidator.updateDiscount,
  DiscountController.updateDiscount
);

module.exports = routes;
