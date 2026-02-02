const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const College = require("../models/college");
const School = require("../models/school")
const s3Service = require("../services/s3.service");

const signup = async (req, res) => {
    try {
        const { name, password, yearOfGraduation, phoneNumber, email, collegeName } = req.body;

        if (!name || !email || !password || !collegeName || !phoneNumber) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Email Validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email address" });
        }

        // Phone Validation
        if (!/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
        }

        const existingUser = await College.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const referralCode = Math.random().toString(36).substring(2, 12).toUpperCase();

        const newCollege = new College({
            name,
            password: hashedPassword,
            yearOfGraduation,
            phoneNumber,
            email,
            collegeName,
            referralCode
        });

        await newCollege.save();

        const token = jwt.sign({ id: newCollege._id, role: "college" }, process.env.JWT_SECRET || "default_secret_key", { expiresIn: "1h" });

        res.status(201).json({ message: "College User created successfully", token, user: newCollege });
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const collegeUser = await College.findOne({ email });
        if (!collegeUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const iSvalidPassword = await bcrypt.compare(password, collegeUser.password);
        if (!iSvalidPassword) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: collegeUser._id, role: "college" }, process.env.JWT_SECRET || "default_secret_key", { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful", token, user: collegeUser });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};
const getCollegeById = async (req, res) => {
    try {
        const collegeUser = await College.findById(req.params.id);
        if (!collegeUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const referral = collegeUser.referralCode;
        const referrals = await School.find({ referralCode: referral });

        const referralsWithSignedUrls = await Promise.all(referrals.map(async (student) => {
            const studentObj = student.toObject();
            if (student.videoKey) {
                studentObj.videoUrl = await s3Service.getVideoUrl(student.videoKey);
            }
            return studentObj;
        }));

        // Calculate Rank
        const higherRankedUsersCount = await College.countDocuments({ referralCount: { $gt: collegeUser.referralCount || 0 } });
        const rank = higherRankedUsersCount + 1;

        res.status(200).json({ collegeUser: { ...collegeUser.toObject(), rank }, referrals: referralsWithSignedUrls });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error: error.message });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const student = await School.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        student.isEnabled = false;
        await student.save();
        res.status(200).json({ message: "Student deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting student", error: error.message });
    }
}



const uploadVideo = async (req, res) => {
    try {
        const { id: studentId } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const student = await School.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const key = await s3Service.uploadVideo(file);

        // Get signed URL for immediate playback
        const url = await s3Service.getVideoUrl(key);

        student.videoUrl = url; // Note: This saves a signed URL which expires. Ideally, we verified schema saves Key. 
        // Saving signed URL to DB is not ideal if it expires. 
        // Better: Save Key to DB (already doing via videoKey). 
        // But frontend currently relies on videoUrl. 
        // Since we sign URLs on fetch (getCollegeById), this saved videoUrl might be stale later.
        // However, for immediate response, it works.
        student.videoKey = key;
        await student.save();

        res.status(200).json({
            message: "Video uploaded successfully",
            url,
            key
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error uploading video", error: error.message });
    }
};

const deleteVideo = async (req, res) => {
    try {
        const { id: studentId } = req.params;
        const student = await School.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        if (student.videoKey) {
            await s3Service.deleteFromS3(student.videoKey);
        }

        student.videoUrl = null;
        student.videoKey = null;
        await student.save();

        res.status(200).json({ message: "Video deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting video", error: error.message });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await College.find({})
            .sort({ referralCount: -1 })
            .select("name collegeName referralCount -_id"); // Select only necessary fields

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Error fetching leaderboard", error: error.message });
    }
};

module.exports = {
    signup,
    login,
    getCollegeById,
    deleteStudent,
    uploadVideo,
    deleteVideo,
    getLeaderboard
};
