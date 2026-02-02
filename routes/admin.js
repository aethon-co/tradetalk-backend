const express = require("express");
const router = express.Router();
const {
    signup,
    login,
    getAllUsers,
    getUserById,
    getAdminById
} = require("../controllers/admin");

router.post("/signup", signup);
router.post("/login", login);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.get("/:id", getAdminById);

module.exports = router;
