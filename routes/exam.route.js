const express = require("express");
const { StartExam } = require("../controllers/exam.controller");
const { validateUserToken, validateLoginJwt } = require("../middlewares/auth");
const { verifyCandidate } = require("../middlewares/verify_exam");

const router = express.Router();

// Start Exam
router
  .route("/:examId/candidate/:candidateId/start")
  .post(validateUserToken, validateLoginJwt, verifyCandidate, StartExam);
module.exports = router;
