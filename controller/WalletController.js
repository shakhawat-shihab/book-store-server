const { validationResult } = require("express-validator");
const HTTP_STATUS = require("../constants/statusCodes");
const { sendResponse } = require("../utils/common");
const WalletModel = require("../model/wallet");
const UserModel = require("../model/User");
const { insertInLog } = require("../server/logFile");

class WalletController {
  async addBalanceToWallet(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.params, req.body);
      const validation = validationResult(req).array();
      if (validation.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Failed to add the user",
          validation
        );
      }

      let { userId, amount } = req.body;
      amount = Number(parseFloat(amount).toFixed(2));

      const userFind = await UserModel.findOne({ _id: userId }).populate(
        "wallet"
      );
      // console.log(userFind);
      if (!userFind) {
        return sendResponse(res, HTTP_STATUS.NOT_FOUND, "User Not Found");
      }

      // wallet not exist
      if (!userFind?.wallet) {
        const result = await WalletModel.create({
          balance: amount,
          statements: { transactionType: "credit", amount, time: new Date() },
        });
        if (result?._id) {
          userFind.wallet = result?._id;
          await userFind.save();
          return sendResponse(
            res,
            HTTP_STATUS.NOT_FOUND,
            "Successfully added money to wallet"
          );
        } else {
          return sendResponse(
            res,
            HTTP_STATUS.NOT_FOUND,
            "Failed to create wallet"
          );
        }
      }
      // wallet exist
      else {
        // console.log("wallet exist");
        let { balance = 0 } = userFind?.wallet;
        balance = Number((balance + amount).toFixed(2));
        const obj = {
          transactionType: "credit",
          amount: amount,
          time: new Date(),
        };
        const walletUpdate = await WalletModel.updateOne(
          { _id: userFind?.wallet?._id },
          { $set: { balance: balance }, $push: { statements: obj } }
        );
        if (walletUpdate?.modifiedCount) {
          return sendResponse(
            res,
            HTTP_STATUS.OK,
            "Successfully updated the balance by " + amount.toFixed(2) + " taka"
          );
        }
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Something went wrong"
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

module.exports = new WalletController();
