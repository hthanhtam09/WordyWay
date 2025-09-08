import mongoose from "mongoose";

export async function connectMongoDB() {
    if (mongoose.connections[0].readyState) {
        return;
    }

    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/wordyway";

    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB with Mongoose");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
}

export async function disconnectMongoDB() {
    await mongoose.disconnect();
}
