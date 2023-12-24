const mongoose = require("mongoose");
const ExamActivity = require("../models/exam_activity");
const TheoryAnswer = require("../models/theory_answer");

module.exports.UpdateExamActivity = async (req, res) => {
  const examActivity = req.examActivity;
  const attemptedQuestions = req.body.attemptedQuestions;
  if (!attemptedQuestions) {
    return res.status(400).json({
      type: "failure",
      message: "Field attempted questions is required",
    });
  }
  try {
    var startTime = examActivity.startTime;
    var currentTime = new Date();

    var usedTime = currentTime.getTime() - startTime.getTime();

    await ExamActivity.findByIdAndUpdate(examActivity._id, {
      attemptedQuestions,
      usedTime,
    });

    return res.status(200).json({
      type: "success",
      message: "exam activity updated successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: "failure",
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

module.exports.UpdateTheoryExamActivity = async (req, res) => {
  try {
    const examActivity = req.examActivity;
    const { answer } = req.body;
    const questionId = req.params.questionId;

    if (!answer || typeof answer != "string") {
      return res.status(400).json({
        info: {
          type: "failure",
          message: "Answer of type string is required",
        },
      });
    }

    if (questionId.length != 24) {
      return res.status(400).json({
        type: "failure",
        message: "Invalid questionId",
      });
    }

    const filter = {
      candidate: examActivity.candidate,
      exam: examActivity.exam,
      examActivity: examActivity._id,
      question: questionId,
    };

    const updatedAnswer = await TheoryAnswer.findOneAndUpdate(
      filter,
      { answer: answer },
      {
        new: true,
        upsert: true,
      }
    );

    return res.status(200).json({
      info: {
        type: "success",
        message: "answer submitted successfully",
      },
      data: {
        answer: updatedAnswer,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: "failure",
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
