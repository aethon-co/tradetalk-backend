const express = require("express");
const router = express.Router();
const {
    signup,
    login,
    getCandidatesWithReferrals
} = require("../controllers/admin");

router.post("/signup", signup);
router.post("/login", login);
router.get("/candidates-referrals", getCandidatesWithReferrals);

module.exports = router;
