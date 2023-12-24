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

  AccessKeyID: process.env.AWS_ACCESS_KEY_I,
  SecretAccessKey: process.env.AWS_SECRET_ACCESS_KE,
  Account_ID: process.env.AWS_ACCOUNT_ID ,
};

module.exports = config;
