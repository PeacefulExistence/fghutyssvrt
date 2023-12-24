const Config = require("../config/config");
const AWS = require("aws-sdk");
const fs = require("fs");
const axios = require("axios").default;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  uploadFile,
  createFlagModule,
} = require("../controllers/flag.controller");

const config = new AWS.Config({
  accessKeyId: Config.AccessKeyID,
  secretAccessKey: Config.SecretAccessKey,
  region: "eu-central-1",
});

module.exports.facialAuthentication = async (req, res) => {
  // fetch request parameters
  const image = req.files.photo;
  const url = req.body.imageUrl;
  // fetch passed image from request
  if (!image || !url) {
    return res.status(400).json({
      success: false,
      message: "Please pass in the source and target images",
    });
  }
  let token = ("" + Math.random()).substring(1, 9);
  const fileName = `Img_${token}_pic.jpg`;
  const localFilePath = "./download/" + fileName;
  imagePaths = [image.tempFilePath, localFilePath];
  try {
    // download image from url
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });
    const downloadedImage = await response.data.pipe(
      fs.createWriteStream(localFilePath)
    );
    downloadedImage.on("finish", async () => {
      // compare images
      var bitmap = fs.readFileSync(image.tempFilePath);
      const sourceBuffer = new Buffer.from(bitmap, "base64");
      bitmap = fs.readFileSync(localFilePath);
      const targetBuffer = new Buffer.from(bitmap, "base64");

      const client = new AWS.Rekognition(config);
      const params = {
        SourceImage: {
          Bytes: sourceBuffer,
        },
        TargetImage: {
          Bytes: targetBuffer,
        },
        SimilarityThreshold: 90,
      };

      client.compareFaces(params, (err, response) => {
        if (err) {
          console.log(err, err.stack);
          deleteFiles(imagePaths);
          return res.status(500).json({
            success: false,
            message: "Aws Error",
            error: err.message,
          });
        } else {
          if (response.FaceMatches.length > 0) {
            response.FaceMatches.forEach((data) => {
              deleteFiles(imagePaths);
              return res.status(200).json({
                success: true,
                message: `face match with confidence level of ${data.Face.Confidence}`,
                match: true,
                similarity: data.Similarity,
                confidence: data.Face.Confidence,
              });
            });
          } else if (response.UnmatchedFaces.length > 0) {
            response.UnmatchedFaces.forEach((data) => {
              deleteFiles(imagePaths);
              return res.status(409).json({
                confidence: data.Confidence,
                success: true,
                match: false,
                message: `face don't match confidence level of ${data.Confidence}`,
              });
            });
          } else {
            return res.status(500).json({
              success: false,
              message: "Aws Error, invalid response",
              error: err.message,
            });
          }
        }
      });
    });
  } catch (err) {
    console.log(err);
    deleteFiles(imagePaths);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

module.exports.inExamFacialAuthentication = async (req, res) => {
  // fetch request parameters
  const image = req.files.photo;
  const url = req.body.imageUrl;
  const { title, time } = req.body;
  const examActivity = req.examActivity;
  // fetch passed image from request
  if (!image || !url) {
    return res.status(400).json({
      success: false,
      message: "Please pass in the image and imageUrl",
    });
  }
  var uuid = "" + uuidv4();
  const fileName = `Img_${uuid}_pic.jpg`;
  const localFilePath = "./download/" + fileName;
  imagePaths = [image.tempFilePath, localFilePath];
  try {
    // image.name = `image_${uuid}${path.parse(image.name).ext}`;
    picName = `image_${uuid}${path.parse(image.name).ext}`;
    // download image from url
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });
    const downloadedImage = await response.data.pipe(
      fs.createWriteStream(localFilePath)
    );
    downloadedImage.on("finish", async () => {
      // compare images
      var bitmap = fs.readFileSync(image.tempFilePath);
      const sourceBuffer = new Buffer.from(bitmap, "base64");
      bitmap = fs.readFileSync(localFilePath);
      const targetBuffer = new Buffer.from(bitmap, "base64");

      const client = new AWS.Rekognition(config);
      const params = {
        SourceImage: {
          Bytes: sourceBuffer,
        },
        TargetImage: {
          Bytes: targetBuffer,
        },
        SimilarityThreshold: 90,
      };

      client.compareFaces(params, (err, response) => {
        if (err) {
          console.log(err, err.stack);
          deleteFiles(imagePaths);
          return res.status(500).json({
            success: false,
            message: "Aws Error",
            error: err.message,
          });
        } else {
          if (response.FaceMatches.length > 0) {
            response.FaceMatches.forEach((data) => {
              deleteFiles(imagePaths);
              return res.status(200).json({
                success: true,
                message: `face match with confidence level of ${data.Face.Confidence}`,
                match: true,
                similarity: data.Similarity,
                confidence: data.Face.Confidence,
              });
            });
          } else if (response.UnmatchedFaces.length > 0) {
            response.UnmatchedFaces.forEach(async (data) => {
              // upload image to firebase
              const uploadFileFirebase = await uploadFile(
                image.tempFilePath,
                image.name,
                "proctorme/flag/media/photos/"
              );

              var mediaLink = uploadFileFirebase[0].metadata.mediaLink;

              var parameters = {
                title: title,
                time: time,
                examActivity: examActivity._id,
                exam: examActivity.exam,
                candidate: examActivity.candidate,
                mediaLink: mediaLink,
              };
              // delete image files
              const flagged = await createFlagModule(parameters);
              if (!flagged.success) {
                deleteFiles(imagePaths);
                return res.status(500).json({
                  success: false,
                  message: flagged.message,
                });
              }
              deleteFiles(imagePaths);
              return res.status(409).json({
                confidence: data.Confidence,
                success: true,
                match: false,
                message: `face don't match confidence level of ${data.Confidence}`,
                flag: flagged.flag,
              });
            });
          } else {
            return res.status(500).json({
              success: false,
              message: "Server Error",
              error: "Aws Error, invalid response",
            });
          }
        }
      });
    });
  } catch (err) {
    console.log(err);
    deleteFiles(imagePaths);
    return res.status(500).json({
      success: false,
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
