const mongoose = require("mongoose")

const schoolSchema = new mongoose.Schema({
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
    // yearOfGraduation: {
    //     type: Number,
    //     required: true,
    //     min: 2000
    // },
    phoneNumber: {
        type: String,
        required: true,
        minlength: 10
    },
    // email: {
    //     type: String,
    //     required: true,
    //     minlength: 3
    // },
    schoolName: {
        type: String,
        required: true,
        minlength: 3
    },
    standard: {
        type: String,
        required: true,
        minlength: 1
    },
    address: {
        type: String,
        required: true,
        minlength: 3
    },
    referralCode: {
        type: String,
        default: 'DIRECT'
    },
    feedbackDetails: {
        type: String,
        minlength: 3
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    videoUrl: {
        type: String,
        default: null
    },
    videoKey: {
        type: String,
        default: null
    }
})

module.exports = mongoose.model('schooluser', schoolSchema)
