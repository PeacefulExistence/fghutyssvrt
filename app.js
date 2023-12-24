// Imports
// Libraries and Frameworks
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const compress = require("compression");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");

// Files
const config = require("./config/config");
const login = require("./routes/login.route");
const exam = require("./routes/exam.route");
const examActivity = require("./routes/exam_activity.route");
const flagAttempt = require("./routes/flag.route");
const media = require("./routes/media_route");
const facialRoutes = require("./routes/faceAuth.routes");

const CURRENT_WORKING_DIR = process.cwd();
const app = express();

// Mongodb Connection
mongoose.Promise = global.Promise;
mongoose.connect(config.mongoUri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
mongoose.connection.on("error", () => {
  throw new Error(`unable to connect to database: ${config.mongoUri}`);
});

//development logs
app.use(morgan("dev"));
// parse body params and attache them to req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compress());
// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// allow file upload
app.use(
  fileUpload({
    useTempFiles: true,
    createParentPath: true,
    tempFileDir: path.join(__dirname, "uploads/temp"),
  })
);

app.use("/", express.static(path.join(CURRENT_WORKING_DIR, "public")));

// Mount Routes
app.get("/", (req, res) => {
  res.status(200).json({
    type: "Success",
    message: "The operation was successful",
  });
});
app.use("/api/exams/", exam);
app.use("/api/examactivities/", examActivity);
app.use("/api/candidates/", login);
app.use("/api/flag/", flagAttempt);
app.use("/api/media/", media);
app.use("/api/facial/", facialRoutes);
app.use("/api/health", (req, res) => {
  return res.status(200).json({
    type: "Success",
    message: "The operation was successful",
  });
});

// Catch unauthorised errors
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    res.status(401).json({ error: err.name + ": " + err.message });
  } else if (err) {
    res.status(400).json({ error: err.name + ": " + err.message });
    console.log(err);
  }
});

const server = app.listen(config.port, (err) => {
  console.log("i am logged the mail", config.email);
  if (err) {
    console.log(err);
  }
  console.info("Server started on port %s.", config.port);
});

module.exports = app;
