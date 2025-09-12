import mongoose from "mongoose";
import { logEnvironmentStatus } from "./env-validation";

export async function connectMongoDB() {
    if (mongoose.connections[0].readyState) {
        return;
    }

    // Validate environment variables
    logEnvironmentStatus();

    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/wordyway";

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000, // Increased timeout for server environments
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferCommands: false, // Disable mongoose buffering
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 2, // Maintain a minimum of 2 socket connections
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
        });
        console.log("Connected to MongoDB with Mongoose");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
}

export async function disconnectMongoDB() {
    await mongoose.disconnect();
}

export async function getConnectionStatus() {
    const connection = mongoose.connections[0];
    return {
        readyState: connection.readyState,
        host: connection.host,
        port: connection.port,
        name: connection.name,
        isConnected: connection.readyState === 1,
    };
}
