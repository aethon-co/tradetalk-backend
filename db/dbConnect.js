const mongoose = require("mongoose");

const dbConnect = async (url) => {
    try {
        await mongoose.connect(url);
        console.log("Database connected");
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports = dbConnect;