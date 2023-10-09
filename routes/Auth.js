const express = require("express");
const routes = express();
const AuthController = require("../controller/AuthController");
const { authValidator } = require("../middleware/validation");
const { checkToken } = require("../middleware/auth");

routes.post("/log-in", authValidator.login, AuthController.login);
routes.post("/sign-up", authValidator.signup, AuthController.signup);
routes.get("/check-me/:token", checkToken, AuthController.aboutMe);

module.exports = routes;
