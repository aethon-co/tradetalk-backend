const express = require("express");
const router = express.Router();
const { signup, login, getSchoolById } = require("../controllers/school");

router.post("/signup", signup);
router.post("/login", login);
router.get("/:id", getSchoolById);

module.exports = router;
