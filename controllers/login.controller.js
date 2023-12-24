const Exam = require("../models/exam");
const Candidate = require("../models/candidate.model");
const { jwtSign } = require("../lib/jwt");
const config = require("../config/config");
const { ExamStatusUpdater } = require("../utils/status_updater");
const Question = require("../models/question.model");
const Plan = require("../models/plan");

// login admin
exports.signIn = async (req, res) => {
  try {
    // Recieve candidate details
    const { email, exam } = req.body.candidate;
    // validate all the fields
    if (!email || !exam) {
      return res.status(400).json({
        type: "failure",
        message: "email and exam fields can't be empty ",
      });
    }

    if (exam.length < 24) {
      return res.status(400).json({
        type: "failure",
        message: "Please enter a valid exam key",
      });
    }

    // validate email

    // fetch candidate
    const fetchedCandidate = await Candidate.findOne({
      email: email.toLowerCase(),
      exam: exam,
    }).select(["-createdAt", "-updatedAt", "-result"]);

    // Check if candidate exist
    if (!fetchedCandidate) {
      return res.status(400).json({
        type: "failure",
        message: "Invalid Credentials! can't find candidate",
      });
    }

    // Check if exam exist
    const examDetails = await Exam.findById(exam).select([
      "-createdAt",
      "-updatedAt",
      "-flagCount",
      "-resultCount",
      "-results",
      "-flags",
      "-questions",
      "-candidates",
    ]);

    if (!examDetails) {
      return res.status(400).json({
        type: "failure",
        message: "Invalid Credentials! can't find exam",
      });
    }

    const status = await ExamStatusUpdater(examDetails);
    if (!status) {
      throw new Error("Status updater failed");
    }

    examDetails.status = status;

    // Fetch Questions and randomized it
    const questions = await Question.find({ exam: exam }).select([
      "-createdAt",
      "-updatedAt",
      "-answer",
    ]);
    var questionCount;
    if (!questions || questions.length < 1) {
      questionCount = 0;
    } else {
      questionCount = questions.length;
    }

    // Check the exam status
    const examStatus = examDetails.status.toLowerCase();
    if (examStatus !== "active") {
      switch (examStatus) {
        case "closed":
          return res.status(200).json({
            type: "success",
            message: "The exam has already been concluded",
            data: { exam: examDetails, candidate: fetchedCandidate },
            // check if result has been marked
          });
        case "not started":
        case "scheduled":
        case "not active":
          return res.status(200).json({
            type: "success",
            message: "The exam is not currently active",
            data: { exam: examDetails, candidate: fetchedCandidate },
          });
        case "created":
          return res.status(200).json({
            type: "success",
            message: "The exam has not been scheduled",
            // data: { exam: examDetails, candidate: fetchedCandidate },
          });
        default:
          return res.status(400).json({
            type: "failure",
            message: "Invalid exam status",
          });
      }
    }

    // check if candiddate activity count is greater than or equal to exam activity count.
    if (examDetails.activityCount == fetchedCandidate.activityCount) {
      return res.status(200).json({
        type: "success",
        message: "you have already attempted this exam",
        data: { exam: examDetails, candidate: fetchedCandidate },
        // check if result has been marked
        // if yes, checked if exam has been marked
        // if no, mark exam
        // return response without token
      });
    }

    // ["created", "completed", "active", "scheduled", "not active"];
    // // create jwt payload
    const payload = {
      candidate: fetchedCandidate._id,
      candidateImage: fetchedCandidate.imageUrl,
      exam: examDetails._id,
      issuer: "ProctormeInExamServer",
      audience: "ProctormeClient",
      subject: "Signin",
    };

    // create authentication token
    const token = await jwtSign(payload, config.jwtSecret, {
      expiresIn: "1h",
    });

    const plan = await Plan.findOne({ title: examDetails.plan });

    return res.status(200).json({
      type: "success",
      data: {
        exam: examDetails,
        candidate: fetchedCandidate,
        questionCount: questionCount,
        plan: plan,
      },
      message: "Candidate Logged in successfully",
      token: token,
    });
  } catch (err) {
    console.log(err);
    if (err.message.includes("Cast to ObjectId failed for value")) {
      return res.status(400).json({
        type: "failure",
        message: "Invalid Credentials! can't find candidate",
      });
    }
    return res.status(500).json({
      type: "failure",
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
