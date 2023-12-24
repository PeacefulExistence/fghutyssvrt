const jwt = require("jsonwebtoken");
const responseHandler = require("../helpers/response");
const config = require("../config/config");

const JWT_SECRET = config.jwtSecret;

const validateUserToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let result;
    if (authHeader) {
      const authString = req.headers.authorization.trim();
      if (!authString) {
        return responseHandler(res, 403, "Authorization Header is missing");
      }
      const prefix = req.headers.authorization.split(" ")[0];
      if (
        prefix !== config.authPrefix &&
        prefix.length !== config.authPrefix.length
      ) {
        return responseHandler(res, 403, "Invalid Authorization Header");
      }
      const token = req.headers.authorization.split(" ")[1];
      // result = jwt.verify(token, JWT_SECRET);
      // if (!result) {
      //   return responseHandler(
      //     res,
      //     403,
      //     "Invalid Authentication token, BAD REQUEST"
      //   );
      // } else {
      //   req.decoded = result;
      //   next();
      // }
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err)
          return res.status(401).json({
            type: "failure",
            message: err.message,
          });
        req.decoded = decoded;
        next();
      });
    } else {
      return responseHandler(
        res,
        400,
        "Authorization header is required, BAD REQUEST"
      );
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: "failure",
      message: err.message,
    });
  }
};

const validateLoginJwt = async (req, res, next) => {
  try {
    const { subject } = req.decoded;
    if (subject.toLowerCase() === "signin") {
      next();
    } else {
      return responseHandler(
        res,
        403,
        "Invalid Authorization token, please login"
      );
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: "failure",
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

const validateExamJwt = async (req, res, next) => {
  try {
    const { subject } = req.decoded;
    if (subject.toLowerCase() === "inexam") {
      next();
    } else {
      return responseHandler(
        res,
        403,
        "Invalid Authorization token, please login"
      );
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: "failure",
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

// Enforce one user at a time login

module.exports = { validateUserToken, validateLoginJwt, validateExamJwt };
