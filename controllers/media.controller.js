// //Firebase Dependencies
// const firebaseAdmin = require("firebase-admin");
// const { v4: uuidv4 } = require("uuid");
// const serviceAccount = require("../config/firebase_key.json");
// const { GenerateToken } = require("../utils/random_key");
// const path = require("path");

// //Initializing firebase
// const proctAdmin = firebaseAdmin.initializeApp({
//   credential: firebaseAdmin.credential.cert(serviceAccount),
// });

// //Storage Reference
// const bucket = proctAdmin.storage().bucket(`gs://me-demo-proctor.appspot.com`);

// const uploadFile = async (file, filename, destination, mediaObject) => {
//   console.log(mediaObject);
//   return bucket.upload(file, {
//     public: true,
//     destination: destination + filename,
//     metadata: {
//       firebaseStorgaeDownloadTokens: uuidv4(),
//       file_info: mediaObject,
//     },
//   });
// };

// const uploadMediaFile = async (req, res) => {
//   try {
//     //get picture from files
//     const file = req.files.mediaFile;
//     var code = GenerateToken(8);
//     var destination = "";

//     var mediaObject = {
//       file_name: file.name,
//       file_type: file.mimetype,
//       file_size: file.size,
//       extension: path.extname(file.name),
//     };

//     // Check if the uploaded file is an image
//     if (file.mimetype.startsWith("image")) {
//       file.name = "IMG" + "_" + code + "_" + file.name;
//       destination = "proctorme/flag/media/photos/";
//     }
//     // check if an audio file was uploaded
//     else if (file.mimetype.startsWith("audio")) {
//       file.name = "AUD" + code + file.name;
//       destination = "proctorme/flag/media/audios/";
//     }
//     // check if a video file was uploaded
//     else if (file.mimetype.startsWith("video")) {
//       file.name = "VID" + code + file.name;
//       destination = "proctorme/flag/media/videos/";
//     } else {
//       return res.status(400).json({
//         type: "failure",
//         message: "BAD REQUEST, Unsupported file format",
//       });
//     }

//     const uploadFileFirebase = await uploadFile(
//       file.tempFilePath,
//       file.name,
//       destination,
//       mediaObject
//     );

//     if (!uploadFileFirebase) {
//       return res.status(500).json({
//         type: "failure",
//         message: "Upload failed",
//         error: err.message,
//       });
//     }

//     return res.status(200).json({
//       type: "success",
//       message: "File uploaded successfully",
//       mediaLink: uploadFileFirebase[0].metadata.mediaLink,
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({
//       type: "failure",
//       message: "Internal Server error",
//       error: err.message,
//     });
//   }
// };

// module.exports = {
//   uploadFile,
//   uploadMediaFile,
// };
