const express = require("express");
const UserController = require("../controller/UserController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { userValidator } = require("../middleware/validation");
const routes = express();

routes.get("/all", isAuthenticated, isAdmin, UserController.getAll);

// we can't provide userId in the route here, because used userId for user Identification
routes.patch(
  "/update/:id",
  isAuthenticated,
  isAdmin,
  userValidator.update,
  UserController.update
);

routes.delete(
  "/delete/:id",
  isAuthenticated,
  isAdmin,
  userValidator.delete,
  UserController.delete
);

module.exports = routes;
