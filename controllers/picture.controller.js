//Firebase Dependencies
const firebaseAdmin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const serviceAccount = require("../config/firebase_key.json");
const path = require("path");

//Initializing firebase
const proctAdmin = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

//Storage Reference
const bucket = proctAdmin.storage().bucket(`gs://me-demo-proctor.appspot.com`);

const uploadFile = async (file, filename) => {
  return bucket.upload(file, {
    public: true,
    destination: `/uploads/proctorme/${filename}`,
    metadata: {
      firebaseStorgaeDownloadTokens: uuidv4(),
    },
  });
};

const uploadPhoto = async (req, res) => {
  try {
    //get picture from files
    const file = req.files.photo;

    const uploadFileFirebase = await uploadFile(file.tempFilePath, file.name);

    if (!uploadFileFirebase) {
      return res.status(500).json({ type: "failure", message: err.message });
    }

    return res.status(200).json({
      type: "success",
      data: uploadFileFirebase[0].metadata.mediaLink,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      type: "failure",
      message: err.message,
    });
  }
};

module.exports = {
  uploadFile,
  uploadPhoto,
};
