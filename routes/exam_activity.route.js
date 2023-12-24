const express = require("express");
const { Submit } = require("../controllers/exam.controller");
const {
  UpdateExamActivity,
  UpdateTheoryExamActivity,
} = require("../controllers/exam_activity.controller.js");
const { validateUserToken, validateExamJwt } = require("../middlewares/auth");
const { verifyExamActivity } = require("../middlewares/verify_exam");

const router = express.Router();

// Update Exam
router
  .route("/:examActivityId/update")
  .put(
    validateUserToken,
    validateExamJwt,
    verifyExamActivity,
    UpdateExamActivity
  );

router
  .route("/:examActivityId/update/theory/:questionId")
  .put(
    validateUserToken,
    validateExamJwt,
    verifyExamActivity,
    UpdateTheoryExamActivity
  );

// Submit
router
  .route("/:examActivityId/submit")
  .put(validateUserToken, validateExamJwt, verifyExamActivity, Submit);
module.exports = router;
