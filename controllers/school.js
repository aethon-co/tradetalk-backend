const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const School = require("../models/school");
const College = require("../models/college"); // Import College model

const signup = async (req, res) => {
    try {
        const { name, password, yearOfGraduation, phoneNumber, schoolName, standard, address, referralCode, feedbackDetails } = req.body;

        const existingUser = await School.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ message: "User with this name already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newSchool = new School({
            name,
            password: hashedPassword,
            yearOfGraduation,
            phoneNumber,
            schoolName,
            standard,
            address,
            referralCode,
            feedbackDetails,
            isEnabled: true
        });

        await newSchool.save();

        // Increment referral count if referral code is present and valid
        if (referralCode && referralCode !== 'DIRECT') {
            await College.findOneAndUpdate(
                { referralCode: referralCode },
                { $inc: { referralCount: 1 } }
            );
        }

        const token = jwt.sign({ id: newSchool._id, role: "school" }, process.env.JWT_SECRET || "default_secret_key", { expiresIn: "1h" });

        res.status(201).json({ message: "School User created successfully", token, user: newSchool });
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { name, password } = req.body;

        const schoolUser = await School.findOne({ name });
        if (!schoolUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValidPassword = await bcrypt.compare(password, schoolUser.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: schoolUser._id, role: "school" }, process.env.JWT_SECRET || "default_secret_key", { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful", token, user: schoolUser });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

const getSchoolById = async (req, res) => {
    try {
        const schoolUser = await School.findById(req.params.id);
        if (!schoolUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(schoolUser);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
};

module.exports = {
    signup,
    login,
    getSchoolById
};
