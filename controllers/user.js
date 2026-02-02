const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const signup = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phoneNumber,
            referredBy,
            role,
        } = req.body;

        if (!name || !email || !password || !phoneNumber) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate unique referral code
        let referralCode;
        let isUnique = false;
        while (!isUnique) {
            referralCode = Math.random().toString(36).substring(2, 12).toUpperCase();
            const existingCode = await User.findOne({ referralCode });
            if (!existingCode) isUnique = true;
        }

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            referralCode,
            referredBy,
            role: role || 'user'
        });

        await newUser.save();

        // Increment referral count for the referrer if applicable
        if (referredBy) {
            await User.findOneAndUpdate(
                { referralCode: referredBy },
                { $inc: { referralCount: 1 } }
            );
        }

        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET || "default_secret_key",
            { expiresIn: "1h" }
        );

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                ...newUser.toObject(),
                password: undefined
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        const user = await User.findOne({ phoneNumber, isEnabled: true });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "default_secret_key",
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                ...user.toObject(),
                password: undefined
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let responseData = { ...user.toObject() };

        // Unified Rank logic
        const referrals = await User.find({ referredBy: user.referralCode, isEnabled: true })
            .select("-password");

        const higherRankedUsersCount = await User.countDocuments({
            referralCount: { $gt: user.referralCount || 0 }
        });
        responseData.rank = higherRankedUsersCount + 1;
        responseData.referrals = referrals;

        res.status(200).json({ collegeUser: responseData }); // Keeping 'collegeUser' key for minimal frontend breakage initially, or cleaner: user: responseData
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.isEnabled = false;
        await user.save();

        // If it was a participant, maybe decrement referral count of partner? 
        // Logic wasn't explicitly there before, but generally good practice. 
        // For now adhering to previous logic: just soft delete.

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.find()
            .sort({ referralCount: -1 })
            .select("name referralCount -_id");

        // Map organizationName back to collegeName if needed for frontend compat, 
        // but frontend updating is part of the plan.
        const mappedLeaderboard = leaderboard.map(u => ({
            name: u.name,
            referralCount: u.referralCount
        }));

        res.status(200).json(mappedLeaderboard);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Error fetching leaderboard", error: error.message });
    }
};

module.exports = {
    signup,
    login,
    getUserById,
    deleteUser,
    getLeaderboard
};
