const express = require("express");
const routes = express();
const AuthController = require("../controller/AuthController");
const { authValidator } = require("../middleware/validation");

routes.post("/log-in", authValidator.login, AuthController.login);
routes.post("/sign-up", authValidator.signup, AuthController.signup);

module.exports = routes;
