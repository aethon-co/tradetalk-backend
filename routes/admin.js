const express = require("express");
const router = express.Router();
const {
    signup,
    login,
    getAllColleges,
    getAllSchools,
    getCollegeById,
    getSchoolById,
    getAdminById
} = require("../controllers/admin");

router.post("/signup", signup);
router.post("/login", login);
router.get("/college", getAllColleges);
router.get("/school", getAllSchools);
router.get("/college/:id", getCollegeById);
router.get("/school/:id", getSchoolById);
router.get("/:id", getAdminById);

module.exports = router;
