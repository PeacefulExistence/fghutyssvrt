const express = require("express");
const { validateMediaFile } = require("../middlewares/verify.media_file");
const { validateUserToken, validateExamJwt } = require("../middlewares/auth");
const { verifyExamActivity } = require("../middlewares/verify_exam");
// const { uploadMediaFile } = require("../controllers/media.controller");
const router = express.Router();

//picture routes
// router
//   .route("/:examActivityId/upload")
//   .post(
//     validateUserToken,
//     validateExamJwt,
//     verifyExamActivity,
//     validateMediaFile,
//     uploadMediaFile
//   );

module.exports = router;
