const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`⚠️ Atlas blocked by firewall. Starting local in-memory database for testing...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`✅ Local Testing Database Connected (In-Memory)`);
    } catch (memError) {
      console.error(`❌ DB Error: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
