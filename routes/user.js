const express = require("express");
const router = express.Router();
const { signup, login, getUserById, deleteUser, getLeaderboard } = require("../controllers/user");

router.post("/signup", signup);
router.post("/login", login);
router.get("/leaderboard", getLeaderboard);
router.get("/:id", getUserById);
router.post("/:id", deleteUser);

module.exports = router;
