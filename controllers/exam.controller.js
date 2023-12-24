const Exam = require("../models/exam");
const Candidate = require("../models/candidate.model");
const InExamActivity = require("../models/exam_activity");
const Question = require("../models/question.model");
const Result = require("../models/result");
const MarkExam = require("../utils/mark.script");
const Randomizer = require("../utils/randomizer");
const { jwtSign } = require("../lib/jwt");
const config = require("../config/config");
const { SHA512 } = require("crypto-js");
const TheoryAnswer = require("../models/theory_answer");
const examActivity = require("../models/exam_activity");

module.exports.StartExam = async (req, res) => {
  try {
    const exam = req.exam._id;
    const candidate = req.candidate._id;
    let { activityCount, examActivities, imageUrl } = req.candidate;

    if (!candidate || !exam) {
      return res.status(400).json({
        type: "failure",
        message: "email, examId or clearance info can't be empty ",
      });
    }

    // check if candidate activity count is greater or equals to exam activities count
    if (activityCount >= req.exam.activityCount) {
      return res.status(403).json({
        type: "failure",
        message: "You have already exceeded the exam attempt limit",
      });
    }

    var punishment = {};

    if (req.exam.punishment.deductPoint.status) {
      punishment.title = "Deduct Point";
      punishment.point = req.exam.punishment.deductPoint.points;
    } else if (req.exam.punishment.deductTime.status) {
      punishment.title = "Deduct Time";
      punishment.point = req.exam.punishment.deductTime.timeInMinutes;
    } else if (req.exam.punishment.suspendExam.status) {
      punishment.title = "Suspend Exam";
      punishment.point = 0;
    } else {
      punishment.title = "None";
      punishment.point = 0;
    }

    let examMode = {
      theory: req.exam.examMode.theory.status,
      objective: req.exam.examMode.objective.status,
      multichoice: req.exam.examMode.multiSelect.status,
      subjective: req.exam.examMode.subjective.status,
    };

    let duration = req.exam.duration,
      objPoint = req.exam.examMode.objective.pointValue,
      multiChoicePoint = req.exam.examMode.multiSelect.pointValue,
      startTime = Date.now(),
      endTime = startTime + duration + 60000,
      examEndDate = req.exam.endDate,
      usedTime = 0,
      status = "active",
      unmarkedResultCount = 1,
      examCandidatesCount = 1;

    // create an inexam instance for the candidate
    const inExamActivity = await InExamActivity.create({
      candidate,
      exam,
      status,
      startTime,
      endTime,
      objPoint,
      punishment,
      multiChoicePoint,
      examEndDate,
      examMode,
      duration,
      usedTime,
    });

    {
      // if (activityCount > 0) {
      //   unmarkedResultCount = 0;
      //   examCandidatesCount = 0;
      //   // delete examActivity
      //   // if result
      //   //      delete result
      //   //      if marked
      //   //              reduce the number of marked result by 1
      //   //      else reduce the number of unmarked result by 1
      //   // delete candidate flags
      //   // reduce candidate flags count
      //   // update examFlagCount,
      //   // reduce exam candidate count
      //     // reduce flag count
      //     // reduce unmarked result count
      //     // reduce marked result count
      // }
    }

    activityCount += 1;
    examActivities.push(inExamActivity._id);

    // Fetch Questions and randomized it
    const questions = await Question.find({ exam: exam }).select([
      "-createdAt",
      "-updatedAt",
      "-answer",
      "-point",
    ]);
    if (!questions || questions.length < 1) {
      return res.status(404).json({
        type: "failure",
        message: "Question List is empty",
      });
    }

    const randomizedQuestions = await Randomizer(questions);

    // Encrypt randomized Questions
    // const encryptedQuestions = SHA512(
    //   randomizedQuestions,
    //   config.encryption_key
    // );

    // create a jwt token using the in exam instance
    // create jwt payload
    const payload = {
      id: inExamActivity._id,
      candidate: candidate,
      candidateImage: imageUrl,
      exam: exam,
      subject: "inExam",
    };

    const expires = duration + 120000;
    // create authentication token
    const token = jwtSign(payload, config.jwtSecret, {
      // expiration token  should be set to duration + 3 minute
      expiresIn: expires,
    });

    // update candidate exam activity count
    await Candidate.findByIdAndUpdate(candidate, {
      activityCount,
      // update FlagCounts
      examActivities,
    });

    // update exam's exam candidate
    await Exam.findByIdAndUpdate(exam, {
      $inc: {
        examCandidatesCount: examCandidatesCount,
        unmarkedResultCount: unmarkedResultCount,
      },
    });

    // return the token to the front end
    return res.status(200).json({
      type: "success",
      message: "Exam successfull started",
      data: {
        examActivity: inExamActivity,
        questions: randomizedQuestions,
        // encrypted_questions: encryptedQuestions,
      },
      token: token,
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

module.exports.Submit = async (req, res) => {
  try {
    const examActivity = req.examActivity;
    var attemptedQuestions = req.body.multichoiceQuestions;
    var theoryQuestions = req.body.theoryQuestions;
    if (!attemptedQuestions) {
      return res.status(400).json({
        type: "failure",
        message: "Field attempted questions is required",
      });
    }

    var startTime = examActivity.startTime;
    var currentTime = new Date();
    var usedTime = currentTime.getTime() - startTime.getTime();

    // if theory is present
    if (
      examActivity.examMode.theory &&
      theoryQuestions &&
      theoryQuestions.length > 0
    ) {
      // update theory questions using upsert
      theoryQuestions.forEach(async (answer) => {
        let filter = {
          candidate: examActivity.candidate,
          exam: examActivity.exam,
          examActivity: examActivity._id,
          question: answer.questionId,
        };
        await TheoryAnswer.findOneAndUpdate(
          filter,
          { answer: answer.answer },
          {
            new: true,
            upsert: true,
          }
        );
      });
    }

    const markExam = MarkExam.markQuestions(examActivity, attemptedQuestions);

    if (typeof markExam === "string") {
      throw new Error(markExam);
    }
    let flaggedResultsCount = 0,
      approvedResultsCount = 0,
      markedResultCount = 0,
      unmarkedResultCount = 0,
      initialScore = 0,
      percentage = 0,
      cleared = false,
      flagged = false,
      isMarked = false;

    attemptedQuestions = (await markExam).questions;
    let score = (await markExam).score;
    let failedCount = (await markExam).objectiveFailedCount;
    let notAnsweredCount = (await markExam).notAnsweredCount;
    let correctCount = (await markExam).objectiveCorrectCount;
    let totalExamScore = (await markExam).totalExamScore;
    let attemptedQuestionsCount = (await markExam).attemptedQuestionsCount;
    let multiChoiceCorrectCount = (await markExam).multiChoiceCorrectCount;
    let multiChoiceFailedCount = (await markExam).multiChoiceFailedCount;
    let totalQuestionsCount = (await markExam).totalQuestionsCount;
    if (examActivity.isFlagged) {
      flagged = true;
      flaggedResultsCount = 1;
    } else {
      cleared = true;
      approvedResultsCount = 1;
    }

    // save initial score
    initialScore = score;
    // handle deducted points
    const pointToBeDeducted = examActivity.pointToBeDeducted;

    if (pointToBeDeducted > 0) score -= pointToBeDeducted;
    // if no theory
    if (!examActivity.examMode.theory || theoryQuestions.length < 1) {
      isMarked = true;
      markedResultCount = 1;
      unmarkedResultCount = -1;
      if (score < 0) {
        // equate score to zero
        score = 0;
      }
    }

    totalExamScore += examActivity.exam.maxTheoryScore;

    if (score > 0) {
      percentage = 100 * (score / totalExamScore);
      percentage = percentage.toFixed(0);
    }

    // console.log({
    //   score: score,
    //   percentage: percentage,
    //   totalExamScore: totalExamScore,
    // });

    // create Result
    const createResult = await Result.create({
      examActivity: examActivity._id,
      exam: examActivity.exam,
      candidate: examActivity.candidate,
      isFlagged: flagged,
      right: correctCount,
      wrong: failedCount,
      isCleared: cleared,
      notAnswered: notAnsweredCount,
      answered: attemptedQuestionsCount,
      deductedMark: examActivity.pointToBeDeducted,
      score: score,
      initialScore: initialScore,
      percentage: percentage,
      totalExamScore: totalExamScore,
      multiChoiceFailedCount: multiChoiceFailedCount,
      multiChoiceCorrectCount: multiChoiceCorrectCount,
      totalQuestions: totalQuestionsCount,
    });

    var result = createResult._id;
    var status = "closed";

    await InExamActivity.findByIdAndUpdate(examActivity._id, {
      attemptedQuestions,
      result,
      isMarked,
      usedTime,
      status,
    });

    // Update exam
    await Exam.findByIdAndUpdate(examActivity.exam, {
      $push: { results: result },
      $inc: {
        resultCount: 1,
        approvedResultsCount: approvedResultsCount,
        flaggedResultsCount: flaggedResultsCount,
        unmarkedResultCount: unmarkedResultCount,
        markedResultCount: markedResultCount,
      },
    });
    // update candidate
    await Candidate.findByIdAndUpdate(examActivity.candidate, {
      $push: { results: result },
      $inc: { resultCount: 1 },
    });

    // check if show score is true
    // check if email result is true

    return res.status(200).json({
      type: "success",
      message: "Submision was successful",
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
