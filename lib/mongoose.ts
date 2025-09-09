import mongoose from "mongoose";

export async function connectMongoDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/wordyway";

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
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
