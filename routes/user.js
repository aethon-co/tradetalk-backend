const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const { signup, login, logout, getMe, getUserById, deleteUser, getLeaderboard } = require("../controllers/user");

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", auth, getMe); // Protected route using cookie
router.get("/leaderboard", getLeaderboard);
router.get("/:id", getUserById); // Keeping for now, but dashboard uses /me
router.post("/:id", deleteUser);

module.exports = router;
