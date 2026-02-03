const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const User = require("../models/user");

const signup = async (req, res) => {
    try {
        const { name, password, username } = req.body;

        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({
            name,
            password: hashedPassword,
            username
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
        const { username, password } = req.body;

        const admin = await Admin.findOne({ username });
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



const getCandidatesWithReferrals = async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: "users", // Collection name is usually plural of model name lowercased
                    localField: "referralCode",
                    foreignField: "referredBy",
                    as: "referredUsers"
                }
            },
            {
                $project: {
                    password: 0, // Exclude password
                    "referredUsers.password": 0 // Exclude passwords of referred users
                }
            }
        ]);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching candidates with referrals", error: error.message });
    }
};

module.exports = {
    signup,
    login,
    getCandidatesWithReferrals
};
