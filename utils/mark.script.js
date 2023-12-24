const Question = require("../models/question.model");

module.exports.markQuestions = async (examActivity, examActivityQuestions) => {
  try {
    const exam = examActivity.exam;
    const questionPoint = examActivity.objPoint;
    const multiChoicePoint = examActivity.multiChoicePoint;

    // Fetch main Exam Questions
    const examQuestions = await Question.find({
      exam: exam,
      // type: "multichoice",
    }).select(["_id", "question", "answer", "numberOfAnswers", "exam", "type"]);
    if (!examQuestions) {
      throw new Error("Exam Questions not found");
    }

    let notAnsweredCount = 0,
      objectiveFailedCount = 0,
      score = 0,
      totalExamScore = 0,
      objectiveCorrectCount = 0,
      multiChoiceCorrectCount = 0,
      attemptedQuestionsCount = 0,
      multiChoicefailedCount = 0;

    let questionMap = new Map();

    examQuestions.forEach((question) => {
      if (question.type != "theory") {
        // Storing the main exam questions in a map
        questionMap.set("" + question._id, question);
        if (question.numberOfAnswers == 1) {
          totalExamScore += examActivity.objPoint;
        } else {
          totalExamScore +=
            question.numberOfAnswers * examActivity.multiChoicePoint;
        }
      }
    });

    if (examActivityQuestions.length > 0) {
      // loop through the exam questions

      examActivityQuestions.forEach((question) => {
        let examQuestion = questionMap.get(question.questionId);
        question.question = examQuestion.question;
        question.image = examQuestion.imageUrl;

        // myArray?.length ? true : false
        // typeof emptyArray != "undefined" && emptyArray != null && emptyArray.length != null && emptyArray.length > 0
        if (!question.selected || question.selected.length < 1) {
          question.correct = false;
          notAnsweredCount += 1;
        } else if (examQuestion.numberOfAnswers == 1) {
          attemptedQuestionsCount += 1;
          if (question.selected[0] === examQuestion.answer[0]) {
            //  if they are equal, set correct to true
            question.correct = true;
            objectiveCorrectCount += 1;
          } else {
            //  if they are not equal, set correct to false
            question.correct = false;
            objectiveFailedCount += 1;
          }
        } else {
          attemptedQuestionsCount += 1;
          // if question has multiple answers
          var answerSummary = new Array();
          question.selected.forEach((answer) => {
            var summary = {
              selected: answer,
              correct: false,
            };
            if (examQuestion.answer.includes(answer)) {
              summary.correct = true;
              multiChoiceCorrectCount += 1;
            } else {
              // if answer is wrong
              multiChoicefailedCount += 1;
            }
            answerSummary.push(summary);
          });
          question.answerSummary = answerSummary;
        }
      });
    }

    if (objectiveCorrectCount > 0)
      score = objectiveCorrectCount * questionPoint;
    if (multiChoiceCorrectCount > 0)
      score += multiChoiceCorrectCount * multiChoicePoint;

    // Return the exam activity, correct count, failed count, not answered count
    // console.log({
    //   questions: examActivityQuestions,
    //   objectiveCorrectCount: objectiveCorrectCount,
    //   objectiveFailedCount: objectiveFailedCount,
    //   notAnsweredCount: examQuestions.length - attemptedQuestionsCount,
    //   attemptedQuestionsCount: attemptedQuestionsCount,
    //   score: score,
    //   totalExamScore: totalExamScore,
    //   multiChoiceCorrectCount: multiChoiceCorrectCount,
    //   multiChoiceFailedCount: multiChoicefailedCount,
    //   totalQuestionsCount: examQuestions.length,
    // });
    return {
      questions: examActivityQuestions,
      objectiveCorrectCount: objectiveCorrectCount,
      objectiveFailedCount: objectiveFailedCount,
      notAnsweredCount: notAnsweredCount,
      attemptedQuestionsCount: attemptedQuestionsCount,
      score: score,
      totalExamScore: totalExamScore,
      multiChoiceCorrectCount: multiChoiceCorrectCount,
      multiChoiceFailedCount: multiChoicefailedCount,
      totalQuestionsCount: examQuestions.length,
    };
  } catch (err) {
    console.log(err);
    return err.message;
  }
};
