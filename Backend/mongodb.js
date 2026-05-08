const mongoose = require('mongoose');

const connectDB = async () => {
    mongoose.connection.on('connected', () => console.log("✅ Database Connected"));
    mongoose.connection.on('error', (err) => console.error("❌ DB connection error:", err));
    mongoose.connection.on('disconnected', () => console.log("⚠️ Database disconnected"));

    try {
        await mongoose.connect(process.env.MONGODB_URL);
    } catch (err) {
        console.error("❌ Failed to connect to DB:", err);
        process.exit(1);
    }
};

module.exports = connectDB;
