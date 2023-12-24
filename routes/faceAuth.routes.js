const express = require("express");
const {
  validateUserToken,
  validateLoginJwt,
  validateExamJwt,
} = require("../middlewares/auth");
const {
  verifyCandidate,
  verifyExamActivity,
} = require("../middlewares/verify_exam");
const {
  facialAuthentication,
  inExamFacialAuthentication,
} = require("../controllers/facialAuth.controller");
const { validatePhoto } = require("../middlewares/verify.photo");

const router = express.Router();

router
  .route("/")
  .post(
    validateUserToken,
    validateLoginJwt,
    validatePhoto,
    facialAuthentication
  );

router
  .route("/:examActivityId/")
  .post(
    validateUserToken,
    validateExamJwt,
    validatePhoto,
    verifyExamActivity,
    inExamFacialAuthentication
  );

module.exports = router;
