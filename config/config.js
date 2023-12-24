require("dotenv").config();
const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "YOUR_secret_key",
  encryption_key: process.env.ENCRYPT_KEY || "I AM legion",
  mongoUri:
    process.env.MONGODB_URI ||
    process.env.MONGO_HOST ||
    "mongodb://" +
      (process.env.IP || "localhost") +
      ":" +
      (process.env.MONGO_PORT || "27017") +
      "/proctormedb",
  password: process.env.PASSWORD,
  saltRounds: process.env.SALTROUNDS || 12,
  authPrefix: process.env.AUTH_HEADER_PREFIX || "BEARER",
  storageBucket: process.env.BUCKET_URL,

  AccessKeyID: "AKIAWL66LJE7G6FMVRUI",
  SecretAccessKey: "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",
  Account_ID: 438016100670,
};

module.exports = config;
