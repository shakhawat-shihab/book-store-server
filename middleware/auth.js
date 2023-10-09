const HTTP_STATUS = require("../constants/statusCodes");
const jsonwebtoken = require("jsonwebtoken");
const { sendResponse } = require("../utils/common");
const { validationResult } = require("express-validator");

const isAuthenticated = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized access");
    }
    const jwt = req.headers.authorization.split(" ")[1];
    const validate = jsonwebtoken.verify(jwt, process.env.SECRET_KEY);
    // jwt verified
    if (validate) {
      const { userId: userIdParams } = req.params;
      const { userId: userIdBody } = req.body;
      const validate = jsonwebtoken.decode(jwt);
      // console.log(
      //   "userIdParams ",
      //   userIdParams,
      //   " &&& userIdBody ",
      //   userIdBody
      // );
      if (
        validate?.user?._id &&
        (validate?.user?._id == userIdParams ||
          validate?.user?._id == userIdBody ||
          (userIdParams == undefined && userIdBody == undefined))
      ) {
        // console.log("inside ", validate?.user?._id);
        req.body.userId = validate?.user?._id;
        next();
      } else {
        return sendResponse(
          res,
          HTTP_STATUS.UNAUTHORIZED,
          "You have access to  your information only"
        );
      }
    } else {
      throw new Error();
    }
  } catch (error) {
    console.log(error);
    if (error instanceof jsonwebtoken.JsonWebTokenError) {
      return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, "Token invalid");
    }
    if (error instanceof jsonwebtoken.TokenExpiredError) {
      return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, "Please log in again");
    }
    return sendResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Internal server error"
    );
  }
};

const isAdmin = (req, res, next) => {
  try {
    // console.log(req.body);
    // console.log(req.params);
    const jwt = req.headers.authorization.split(" ")[1];
    const validate = jsonwebtoken.decode(jwt);
    if (validate.role === 1) {
      next();
    } else {
      return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized access");
    }
  } catch (error) {
    // console.log(error);
    return sendResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Internal server error"
    );
  }
};

const checkToken = (req, res, next) => {
  try {
    const { token } = req.params;
    const validation = validationResult(req).array();
    if (validation.length > 0) {
      return sendResponse(
        res,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        "Failed to add the user",
        validation
      );
    }
    const validate = jsonwebtoken.verify(token, process.env.SECRET_KEY);
    if (validate) {
      const validate = jsonwebtoken.decode(token);
      console.log(validate);
      req.body.authId = validate?._id;
      next();
    } else {
      return sendResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid token provided"
      );
    }
  } catch (error) {
    console.log("e ", error);
    return sendResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Internal server error"
    );
  }
};

const checkUserIdWithParamsId = (req, res, next) => {
  try {
    // console.log(req.params);
    const { userId } = req.params;
    const jwt = req.headers.authorization.split(" ")[1];
    const validate = jsonwebtoken.decode(jwt);
    console.log(validate?.user?._id);
    if (validate?.user?._id == userId) {
      next();
    } else {
      return sendResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "You have access to  your information only"
      );
    }
  } catch (error) {
    // console.log(error);
    return sendResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Internal server error"
    );
  }
};

const checkUserIdWithBodyId = (req, res, next) => {
  try {
    // console.log(req.body);
    const { userId } = req.body;
    const jwt = req.headers.authorization.split(" ")[1];
    const validate = jsonwebtoken.decode(jwt);
    // console.log(validate?.user?._id);
    if (validate?.user?._id == userId) {
      next();
    } else {
      return sendResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "You have access to  your information only"
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
};

module.exports = {
  isAuthenticated,
  isAdmin,
  checkUserIdWithParamsId,
  checkUserIdWithBodyId,
  checkToken,
};
