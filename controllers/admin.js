const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const College = require("../models/college");
const School = require("../models/school");

const signup = async (req, res) => {
    try {
        const { name, password, email } = req.body;

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({
            name,
            password: hashedPassword,
            email
        });

        await newAdmin.save();

        const token = jwt.sign({ id: newAdmin._id, role: "admin" }, process.env.JWT_SECRET || "default_secret_key", { expiresIn: "1h" });

        res.status(201).json({ message: "Admin created", token, user: newAdmin });
    } catch (error) {
        res.status(500).json({ message: "Error creating admin", error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET || "default_secret_key", { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful", token, user: admin });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

const getAllColleges = async (req, res) => {
    try {
        const colleges = await College.find();
        res.status(200).json(colleges);
    } catch (error) {
        res.status(500).json({ message: "Error fetching colleges", error: error.message });
    }
};

const getAllSchools = async (req, res) => {
    try {
        const schools = await School.find();
        res.status(200).json(schools);
    } catch (error) {
        res.status(500).json({ message: "Error fetching schools", error: error.message });
    }
};

const getCollegeById = async (req, res) => {
    try {
        const college = await College.findById(req.params.id);
        if (!college) {
            return res.status(404).json({ message: "College not found" });
        }
        res.status(200).json(college);
    } catch (error) {
        res.status(500).json({ message: "Error fetching college", error: error.message });
    }
};

const getSchoolById = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) {
            return res.status(404).json({ message: "School not found" });
        }
        res.status(200).json(school);
    } catch (error) {
        res.status(500).json({ message: "Error fetching school", error: error.message });
    }
};

const getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ message: "Error fetching admin", error: error.message });
    }
};

module.exports = {
    signup,
    login,
    getAllColleges,
    getAllSchools,
    getCollegeById,
    getSchoolById,
    getAdminById
};
