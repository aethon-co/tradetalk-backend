const express = require("express");
const router = express.Router();
const { signup, login, getCollegeById, deleteStudent, uploadVideo, deleteVideo, getLeaderboard } = require("../controllers/college");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/signup", signup);
router.post("/login", login);
router.get("/leaderboard", getLeaderboard);
router.get("/:id", getCollegeById);
router.post("/:id/upload", upload.single("file"), uploadVideo);
router.post("/:id/video/delete", deleteVideo);
router.post("/:id", deleteStudent);

module.exports = router;
