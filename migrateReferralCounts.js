const mongoose = require("mongoose");
require("dotenv").config();
const dbConnect = require("./db/dbConnect");
const College = require("./models/college");
const School = require("./models/school");

const migrate = async () => {
    try {
        if (!process.env.MONGOURL) {
            console.error("Error: MONGOURL environment variable is not defined.");
            process.exit(1);
        }

        await dbConnect(process.env.MONGOURL);

        console.log("Starting referral count migration...");

        const colleges = await College.find({});
        console.log(`Found ${colleges.length} colleges to process.`);

        let updatedCount = 0;

        for (const college of colleges) {
            // Count valid referrals for this college
            const count = await School.countDocuments({
                referralCode: college.referralCode
            });

            // Force update to ensure field exists in DB, even if value is same
            await College.updateOne(
                { _id: college._id },
                { $set: { referralCount: count } }
            );

            console.log(`Processed ${college.name} (${college.referralCode}): set to ${count}`);
            updatedCount++;
        }

        console.log(`Migration completed. Processed ${updatedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
