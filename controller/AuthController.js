const { validationResult } = require("express-validator");
const HTTP_STATUS = require("../constants/statusCodes");
const bcrypt = require("bcrypt");
const AuthModel = require("../model/Auth");
const UserModel = require("../model/User");
const jsonwebtoken = require("jsonwebtoken");
const { sendResponse } = require("../utils/common");
const { insertInLog } = require("../server/logFile");

class AuthModelController {
  async login(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, { email: req?.body?.email });
      const validation = validationResult(req).array();
      if (validation.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Failed to add the user",
          validation
        );
      }
      const { email, password } = req.body;
      const auth = await AuthModel.findOne({ email: email })
        .populate("user", "-createdAt -updatedAt -__v")
        .select("-createdAt -updatedAt -__v");
      // console.log(auth);
      // console.log(req.body);
      if (!auth) {
        return sendResponse(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          "User is not registered"
        );
      }
      const checkPassword = await bcrypt.compare(password, auth.password);

      if (!checkPassword) {
        return sendResponse(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          "Invalid credentials"
        );
      }
      const responseAuthModel = auth.toObject();
      delete responseAuthModel.password;

      const jwt = jsonwebtoken.sign(responseAuthModel, process.env.SECRET_KEY, {
        expiresIn: "2 days",
      });

      responseAuthModel.token = jwt;
      return sendResponse(
        res,
        HTTP_STATUS.OK,
        "Successfully logged in",
        responseAuthModel
      );
    } catch (error) {
      console.log(error);
      return sendResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async signup(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, {
        email: req?.body?.email,
        userName: req?.body?.userName,
        phone: req?.body?.phone,
      });
      const validation = validationResult(req).array();
      if (validation.length > 0) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Failed to add the user",
          validation
        );
      }
      const { userName, email, password, phone, address, role } = req.body;
      // console.log(req.body);
      const auth = await AuthModel.findOne({
        $or: [{ email: email }, { userName: userName }],
      });
      if (auth?.email == email && auth?.userName == userName) {
        return sendResponse(
          res,
          HTTP_STATUS.CONFLICT,
          "Email is already registered and userName is not available",
          [
            { msg: "Email is already registered", path: "email" },
            { msg: "userName is not available", path: "userName" },
          ]
        );
      } else if (auth?.email == email) {
        return sendResponse(
          res,
          HTTP_STATUS.CONFLICT,
          "Email is already registered",
          [{ msg: "Email is already registered", path: "email" }]
        );
      } else if (auth?.userName == userName) {
        return sendResponse(
          res,
          HTTP_STATUS.CONFLICT,
          "userName is not available",
          [{ msg: "userName is not available", path: "userName" }]
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10).then((hash) => {
        return hash;
      });

      const user = await UserModel.create({
        userName: userName,
        email: email,
        phone: phone,
        address: address,
      });
      const result = await AuthModel.create({
        email: email,
        password: hashedPassword,
        userName: userName,
        role: role,
        verified: false,
        user: user._id,
      });
      if (!result) {
        return sendResponse(
          res,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          "Failed to add the user"
        );
      }

      return sendResponse(res, HTTP_STATUS.OK, "Successfully signed up", user);
    } catch (error) {
      // console.log(error);
      return sendResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async aboutMe(req, res) {
    try {
      insertInLog(req?.originalUrl, req.query, req.params);
      const { authId } = req.body;

      const auth = await AuthModel.findOne({ _id: authId })
        .populate("user", "-createdAt -updatedAt -__v")
        .select("-createdAt -updatedAt -__v");

      const responseAuthModel = auth.toObject();
      delete responseAuthModel.password;

      return sendResponse(
        res,
        HTTP_STATUS.OK,
        "Valid Token Provided",
        responseAuthModel
      );
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

module.exports = new AuthModelController();
