const mongoose = require('mongoose')
const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGOOSE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
        });
        console.log("MongoDB Connected.");
    } catch (error) {
        console.error("Failed to connect MongoDB:", error);
        process.exit(1); // Stop execution if DB is not connected
    }
};

module.exports = connectToDatabase