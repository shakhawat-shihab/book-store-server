const express = require("express");
const routes = express();
const { isAuthenticated } = require("../middleware/auth");
const WalletController = require("../controller/WalletController");
const { walletValidator } = require("../middleware/validation");

routes.patch(
  "/add-balance",
  isAuthenticated,
  walletValidator.addMoney,
  WalletController.addBalanceToWallet
);

module.exports = routes;
