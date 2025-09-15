require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ Connected to MongoDB Atlas!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection error:", err.message);
    process.exit(1);
  }
})();
