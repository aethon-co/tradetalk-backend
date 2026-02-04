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

        const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: "User with this email already exists" });
            }
            if (existingUser.phoneNumber === phoneNumber) {
                return res.status(400).json({ message: "User with this phone number already exists" });
            }
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
            { expiresIn: "2d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
        });

        res.status(201).json({
            message: "User created successfully",
            // token, // Token is now in cookie, optional to send back if needed but better not to rely on it in frontend
            user: {
                ...newUser.toObject(),
                password: undefined
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `User with this ${field} already exists` });
        }
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
            { expiresIn: "2d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
        });

        res.status(200).json({
            message: "Login successful",
            // token,
            user: {
                ...user.toObject(),
                password: undefined
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware
        const user = await User.findById(userId).select("-password");

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

        res.status(200).json({ collegeUser: responseData });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error logging out", error: error.message });
    }
}

const getUserById = async (req, res) => {
    // Deprecated for self-fetch, keeping strictly for admin or public profile if needed
    // But for now, getMe replaces the dashboard logic.
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
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
    logout,
    getMe,
    getUserById,
    deleteUser,
    getLeaderboard
};
