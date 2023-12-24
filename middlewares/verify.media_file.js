const validateMediaFile = async (req, res, next) => {
  // Check if a file is uploaded
  if (!req.files) {
    return res
      .status(400)
      .json({ type: "failure", message: `Please upload a media file` });
  }

  const media = req.files.mediaFile;

  console.log(media.mimetype);

  // Check if the uploaded file is an image
  if (media.mimetype.startsWith("image")) {
    // Check if size is more than 2MB
    if (media.size > 2048 * 1024) {
      return res.status(400).json({
        type: "failure",
        message: "BAD REQUEST, Image file must be less than 2mb",
      });
    }
  }
  // check if an audio file was uploaded
  else if (media.mimetype.startsWith("audio")) {
    // Check if size is more than 10MB
    if (media.size > 10240 * 1024) {
      return res.status(400).json({
        type: "failure",
        message: "BAD REQUEST, audio file must be less than 10mb",
      });
    }
  }
  // check if a video file was uploaded
  else if (media.mimetype.startsWith("video")) {
    // Check if size is more than 20MB
    if (media.size > 20480 * 1024) {
      return res.status(400).json({
        type: "failure",
        message: "BAD REQUEST, video file must be less than 20mb",
      });
    }
  } else {
    return res.status(400).json({
      type: "failure",
      message: "BAD REQUEST, Unsupported file format",
    });
  }
  next();
};

module.exports = {
  validateMediaFile,
};
