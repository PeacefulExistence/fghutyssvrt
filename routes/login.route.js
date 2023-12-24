const express = require("express");
const { signIn } = require("../controllers/login.controller");

const router = express.Router();

router.route("/login").post(signIn);
module.exports = router;
