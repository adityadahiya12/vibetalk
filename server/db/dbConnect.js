import mongoose from "mongoose";
import dns from "dns";

const dbConnection = async () => {
  // Configure reliable public DNS servers to resolve MongoDB Atlas SRV records on Windows
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (dnsErr) {
    console.warn("Could not set custom DNS servers:", dnsErr.message);
  }

  const primaryUri = process.env.MONGOOSE_CONNECTION;
  const localUri = "mongodb://127.0.0.1:27017/vibetalk";

  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri);
      console.log(" ✅ Connected to DataBase (Primary)");
      return;
    } catch (error) {
      console.warn(` ⚠️ Primary MongoDB connection failed: ${error.message}`);
      console.log(" 🔄 Attempting fallback connection to local MongoDB...");
    }
  }

  try {
    await mongoose.connect(localUri);
    console.log(" ✅ Connected to DataBase (Local Fallback)");
  } catch (localError) {
    console.error(" ❌ Failed to connect to local DataBase:", localError.message);
    throw localError;
  }
};

export default dbConnection;