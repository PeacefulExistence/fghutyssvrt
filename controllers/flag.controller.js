const Flag = require("../models/flag");
const Exam = require("../models/exam");
const ExamActivity = require("../models/exam_activity");
const Candidate = require("../models/candidate.model");
const firebaseAdmin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const serviceAccount = require("../config/firebase_key.json");

//Initializing firebase
const proctAdmin = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

//Storage Reference
const bucket = proctAdmin.storage().bucket(`gs://me-demo-proctor.appspot.com`);

const uploadFile = async (file, filename, destination) => {
  return bucket.upload(file, {
    public: true,
    destination: destination + filename,
    metadata: {
      firebaseStorgaeDownloadTokens: "" + uuidv4(),
      // name: filename,
    },
  });
};

const createFlag = async (req, res) => {
  const file = req.files.mediaFile;
  try {
    const { candidate, exam, _id, startTime } = req.examActivity;
    let { description, title, timeOfOccurence } = req.body;
    let destination = "";
    // checking if file is passed

    if (!title) {
      return res.status(400).json({
        type: "failure",
        message: " Title is required",
      });
    }

    if (!file) {
      return res.status(400).json({
        type: "failure",
        message: "BAD REQUEST, Media file is missing",
      });
    }
    let uuid = "" + uuidv4();

    // Check if the uploaded file is an image
    if (file.mimetype.startsWith("image")) {
      // change file name
      file.name = `image_${uuid}${path.parse(file.name).ext}`;
      destination = "proctorme/flag/media/photos/";
    }
    // check if an audio file was uploaded
    else if (file.mimetype.startsWith("audio")) {
      // change file name
      file.name = `audio_${uuid}${path.parse(file.name).ext}`;
      destination = "proctorme/flag/media/audios/";
    }
    // check if a video file was uploaded
    else if (file.mimetype.startsWith("video")) {
      // change file name
      file.name = `video_${uuid}${path.parse(file.name).ext}`;
      destination = "proctorme/flag/media/videos/";
    } else {
      return res.status(400).json({
        type: "failure",
        message: "BAD REQUEST, Unsupported file format",
      });
    }

    // upload file to firebase
    const uploadFileFirebase = await uploadFile(
      file.tempFilePath,
      file.name,
      destination
    );

    if (!uploadFileFirebase) {
      return res.status(500).json({
        type: "failure",
        message: "Upload failed",
        error: err.message,
      });
    }

    let mediaLink = uploadFileFirebase[0].metadata.mediaLink;

    const time = Date.now();

    // get media file

    const examActivity = _id;
    // create flag
    const newFlag = await Flag.create({
      candidate,
      exam,
      description,
      time,
      title,
      examActivity,
      mediaLink,
    });

    // set isFlagged to true
    let isFlagged = true;
    let flaggedCandidatesCount = 0;

    if (!req.examActivity.isFlagged) {
      flaggedCandidatesCount = 1;
    }

    // update flags and isFlagged in exam activity
    await ExamActivity.findByIdAndUpdate(examActivity, {
      $push: { flags: newFlag._id },
      $inc: { flagCount: 1 },
      isFlagged,
    });

    // update flags and isFlagged in ecandidate
    await Candidate.findByIdAndUpdate(candidate, {
      $push: { flags: newFlag._id },
      $inc: { flagCount: 1 },
    });

    // update flags and isFlagged in exam
    await Exam.findByIdAndUpdate(exam, {
      $push: { flags: newFlag._id },
      $inc: { flagCount: 1, flaggedCandidatesCount: flaggedCandidatesCount },
    });

    deleteFile(file.tempFilePath);

    return res.status(200).json({
      type: "success",
      message: "Flag created successfully",
      flag: newFlag,
    });
  } catch (err) {
    deleteFile(file.tempFilePath);
    console.log(err);
    return res.status(500).json({
      type: "failure",
      message: "Server Error",
      error: err.message,
    });
  }
};

const createFlagModule = async (params) => {
  var response;
  try {
    // // upload file to firebase
    // const uploadFileFirebase = await uploadFile(
    //   params.image.tempFilePath,
    //   params.imageName,
    //   params.destination
    // );

    // if (!uploadFileFirebase) {
    //   response.success = false;
    //   response.message = "Failed to upload Photo";
    //   return response;
    // }

    // var mediaLink = uploadFileFirebase[0].metadata.mediaLink;

    const newFlag = await Flag.create({
      candidate: params.candidate,
      exam: params.exam,
      description: params.description,
      time: params.time,
      title: params.title,
      examActivity: params.examActivity,
      mediaLink: params.mediaLink,
    });

    if (!newFlag) {
      return {
        message: "Failed to create new flag",
        success: false,
      };
    }

    // check if candidate have already been flagged
    // if not increase exam.flaggedCandidatesCount by 1
    // set isFlagged to true
    var isFlagged = true;

    // update flags and isFlagged in exam activity
    await ExamActivity.findByIdAndUpdate(params.examActivity, {
      $push: { flags: newFlag._id },
      $inc: { flagCount: 1 },
      isFlagged,
    });

    // update flags and isFlagged in ecandidate
    await Candidate.findByIdAndUpdate(params.candidate, {
      $push: { flags: newFlag._id },
      $inc: { flagCount: 1 },
    });

    // update flags and isFlagged in exam
    await Exam.findByIdAndUpdate(params.exam, {
      $push: { flags: newFlag._id },
      $inc: { flagCount: 1 },
    });

    return {
      success: true,
      message: "Flag created successfully",
      flag: newFlag,
    };
  } catch (err) {
    console.log(err);
    return {
      message: err.message,
      success: false,
    };
  }
};

const exitFullScreen = async (req, res) => {
  try {
    // fetch body from request
    const { candidate, exam, _id, startTime, punishment } = req.examActivity;
    const { description, title, time } = req.body;
    const examActivity = _id;
    var pointToBeDeducted = 0;
    var isCancelled = false;
    var timeDeducted = 0;
    var status = "active";
    var endTime = req.examActivity.endTime;
    // punish candidate
    if (punishment.title == "Deduct Point") {
      // increase point deducted
      pointToBeDeducted = punishment.point;
    } else if (punishment.title == "Deduct Time") {
      // reduce candidate time
      timeDeducted = punishment.point;
      endTime -= timeDeducted * 1000 * 60;
    } else if (punishment.title == "Suspend Exam") {
      // suspend exam
      isCancelled = true;
      status = "closed";
      // markScript
    } else {
      // do nothing
    }

    // create flag
    const newFlag = await Flag.create({
      candidate,
      exam,
      deductedMark: pointToBeDeducted,
      deductedTime: timeDeducted,
      description,
      title,
      examActivity,
      isCleared: true,
      penalty: punishment.title.toLowerCase(),
    });

    // update flags and isFlagged in exam activity
    await ExamActivity.findByIdAndUpdate(examActivity, {
      $push: { flags: newFlag._id },
      $inc: {
        flagCount: 1,
        pointToBeDeducted: pointToBeDeducted,
        timeDeducted: timeDeducted,
      },
      endTime,
      isCancelled,
      status,
    });

    // update flags and isFlagged in ecandidate
    await Candidate.findByIdAndUpdate(candidate, {
      $push: { flags: newFlag._id },
      $inc: { flagCount: 1 },
    });

    // update flags and isFlagged in exam
    await Exam.findByIdAndUpdate(exam, {
      $push: { flags: newFlag._id },
      $inc: { flagCount: 1 },
    });

    return res.status(200).json({
      type: "success",
      message: "The operation was successful",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: "failure",
      message: "Server Error",
      error: err.message,
    });
  }
};

const deleteFiles = (pathArray) => {
  try {
    pathArray.forEach((imagePath) => {
      fs.unlinkSync(imagePath);
    });
  } catch (err) {
    console.log(err);
  }
};

const deleteFile = (path) => {
  try {
    fs.unlinkSync(path);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  uploadFile,
  createFlag,
  createFlagModule,
  exitFullScreen,
};
