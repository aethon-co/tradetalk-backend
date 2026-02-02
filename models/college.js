const mongoose = require("mongoose")

const collegeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    yearOfGraduation: {
        type: Number,
        required: true,
        minlength: 4
    },
    phoneNumber: {
        type: Number,
        required: true,
        minlength: 10
    },
    email: {
        type: String,
        required: true,
        minlength: 3
    },
    collegeName: {
        type: String,
        required: true,
        minlength: 3
    },
    referralCode: {
        type: String,
        required: true,
        minlength: 3
    },
    referralCount: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('collegeuser', collegeSchema)