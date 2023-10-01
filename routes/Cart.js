const express = require("express");
const routes = express();
const { cartValidator } = require("../middleware/validation");
const {
  isAuthenticated,
  isAdmin,
  checkUserIdWithParamsId,
  checkUserIdWithBodyId,
} = require("../middleware/auth");
const CartController = require("../controller/CartController");

routes.get(
  "/:userId",
  isAuthenticated,
  cartValidator.getCartOfUser,
  CartController.getCart
);

routes.post(
  "/add-book",
  isAuthenticated,
  cartValidator.addRemoveInCart,
  CartController.addBookToCart
);

routes.patch(
  "/remove-book",
  isAuthenticated,
  cartValidator.addRemoveInCart,
  CartController.removeBookFromCart
);

module.exports = routes;
