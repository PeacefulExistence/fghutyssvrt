const express = require("express");
const {
  createFlag,
  exitFullScreen,
} = require("../controllers/flag.controller");
const { verifyExamActivity } = require("../middlewares/verify_exam");
const { validateExamJwt, validateUserToken } = require("../middlewares/auth");

const router = express.Router();

router
  .route("/:examActivityId")
  .post(validateUserToken, validateExamJwt, verifyExamActivity, createFlag);

router
  .route("/:examActivityId/exitfullscreen")
  .post(validateUserToken, validateExamJwt, verifyExamActivity, exitFullScreen);
module.exports = router;
