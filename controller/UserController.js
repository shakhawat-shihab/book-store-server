const { validationResult } = require("express-validator");
const HTTP_STATUS = require("../constants/statusCodes");
const { sendResponse } = require("../utils/common");
const UserModel = require("../model/User");
const AuthModel = require("../model/Auth");
const { insertInLog } = require("../server/logFile");

class UserController {
  async getAll(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.body);
      const validation = validationResult(req).array();
      if (validation.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Failed to add the user",
          validation
        );
      }

      const { page = 1, limit = 10 } = req.query;

      if (page < 1 || limit < 0) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Page and limit values must be at least 1"
        );
      }

      const result = await UserModel.find({})
        .select("-createdAt -updatedAt -__v")
        .skip((page - 1) * limit)
        .limit(limit ? limit : 100);
      const userCount = await UserModel.find().count();

      if (result?.length) {
        return sendResponse(res, HTTP_STATUS.OK, "Successfully loaded users", {
          userCount: userCount,
          count: result.length,
          page: parseInt(page),
          limit: parseInt(limit),
          user: result,
        });
      }
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, "No User Found");
    } catch (error) {
      console.log(error);
      return sendResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async delete(req, res) {
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

      const { id } = req.params;

      const user = await UserModel.findOne({ _id: id });
      const auth = await AuthModel.findOne({ user: id });

      if (!user || !auth) {
        return sendResponse(res, HTTP_STATUS.NOT_FOUND, "No User Found");
      }

      const userDelete = await UserModel.deleteOne({ _id: id });
      const authDelete = await AuthModel.deleteOne({ user: id });

      if (userDelete?.deletedCount && authDelete?.deletedCount) {
        return sendResponse(res, HTTP_STATUS.OK, "Successfully deleted");
      }

      return sendResponse(
        res,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "Something went wrong"
      );
    } catch (error) {
      //   console.log(error);
      return sendResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async update(req, res) {
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

      const { userName, phone, firstName, lastName, address } = req.body;
      const { id } = req.params;

      const userFind = await UserModel.findOne({ _id: id });
      if (!userFind) {
        return sendResponse(res, HTTP_STATUS.NOT_FOUND, "User Not Found");
      }

      const userUpdate = await UserModel.updateOne(
        { _id: id },
        { $set: { userName, phone, address, firstName, lastName } }
      );

      // console.log(userUpdate);

      if (userUpdate?.modifiedCount) {
        return sendResponse(
          res,
          HTTP_STATUS.OK,
          "Successfully updated user data"
        );
      }
      return sendResponse(
        res,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "Something went wrong"
      );
    } catch (error) {
      //   console.log(error);
      return sendResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
}

module.exports = new UserController();
