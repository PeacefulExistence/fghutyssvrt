const Exam = require("../models/exam");
const ExamActivity = require("../models/exam_activity");
const Candidate = require("../models/candidate.model");
const { ExamStatusUpdater } = require("../utils/status_updater");

const verifyCandidate = async (req, res, next) => {
  try {
    const exam_id = req.decoded.exam;
    const candidate_id = req.decoded.candidate;
    const clearanceInfo = req.body.clearanceInfo;
    const { examId, candidateId } = req.params;

    // check to see if candidate have completed environmental and facial checks
    if (!clearanceInfo) {
      return res.status(400).json({
        type: "failure",
        message:
          "NOT VALIDATED! Please go through the environmental and Facial check again.",
      });
    }

    // check if the request contains the needed fields
    if (exam_id != examId || candidate_id != candidateId) {
      return res.status(400).json({
        type: "failure",
        message: "Invalid Credentials... Please login and try again",
      });
    }

    // fetching exam by id from db
    const exam = await Exam.findOne({ _id: exam_id });

    if (!exam) {
      return res.status(400).json({
        type: "failure",
        message: "Invalid examId",
      });
    }

    const status = await ExamStatusUpdater(exam);
    if (!status) {
      throw new Error("Status updater failed");
    }

    // check exam status
    const examStatus = status.toLowerCase();
    if (examStatus !== "active") {
      switch (examStatus) {
        case "closed":
        case "completed":
          return res.status(403).json({
            type: "failure",
            message: "The exam has already been concluded",
          });
        case "created":
        case "scheduled":
          return res.status(403).json({
            type: "failure",
            message: "The exam is not currently active",
          });
        default:
          return res.status(403).json({
            type: "failure",
            message: "Invalid exam status",
          });
      }
    }

    // fetch candidate by id
    const candidate = await Candidate.findById(candidate_id);

    if (!candidate) {
      return res.status(401).json({
        type: "failure",
        message: "invalid candidate",
      });
    }

    // Check if candidate is registered for the exam
    if (candidate.exam != exam_id) {
      return res.status(403).json({
        type: "failure",
        message: "Candidate is not registered for this exam",
      });
    }

    //  Check if candidate number of exam activity is greater or equal to exam limit
    if (candidate.inExamActivityCount >= exam.examActivityCount) {
      return res.status(400).json({
        type: "failure",
        message: "Candidate have exceed the max number of attempts",
      });
    }

    // Add the exam details to the request
    req.exam = exam;
    req.candidate = candidate;
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: "failure",
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

const verifyExam = async (req, res, next) => {
  const { examActivityId } = req.params;
  const exam_id = req.decoded.exam;

  const fetchedExam = await Exam.findById(exam_id);
  if (!fetchedExam) {
    return res.status(400).json({
      type: "failure",
      message: "Invalid exam id",
    });
  }
  const status = await ExamStatusUpdater(fetchedExam);
  if (!status) {
    return res.status(500).json({
      type: "failure",
      message: "Failed to check status with status Updater",
    });
  }

  // Check the exam status
  const examStatus = status.toLowerCase();
  if (examStatus !== "active") {
    switch (examStatus) {
      case "closed":
        return res.status(401).json({
          type: "success",
          message: "The exam has already been concluded",
        });
      case "scheduled":
      case "created":
        return res.status(401).json({
          type: "success",
          message: "The exam is not currently active",
        });
      default:
        return res.status(500).json({
          type: "failure",
          message: "Invalid exam status",
        });
    }
  }
  next();
};

const verifyExamActivity = async (req, res, next) => {
  const { examActivityId } = req.params;
  const exam_activity_id = req.decoded.id;

  try {
    // Check if exam activity id in the jwt equals the one from the request parameter
    if (examActivityId !== exam_activity_id) {
      return res.status(400).json({
        type: "failure",
        message: "Invalid exam Activity",
      });
    }

    // check if exam activity exists
    const examActivity = await ExamActivity.findById(exam_activity_id).populate(
      {
        path: "exam",
        select: ["maxTheoryScore"],
      }
    );
    if (!examActivity) {
      return res.status(400).json({
        type: "failure",
        message: "Invalid exam Activity.",
      });
    }

    // check if the examactivity status is active
    if (examActivity.status.toLowerCase() !== "active") {
      return res.status(401).json({
        type: "failure",
        message: "Your exam session has ended",
      });
    }
    // Check if the exam activity end time have been exceeded
    else if (
      Date.now() > examActivity.endTime ||
      Date.now() > examActivity.examEndDate
    ) {
      var message;
      if (Date.now() > examActivity.examEndDate) {
        message = "Exam window has closed";
      } else {
        message = "Your exam session has ended";
      }
      return res.status(401).json({
        type: "failure",
        message: message,
      });
    }

    // add the exam activity to the request
    req.examActivity = examActivity;
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: "failure",
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

module.exports = {
  verifyCandidate,
  verifyExamActivity,
  verifyExam,
};
