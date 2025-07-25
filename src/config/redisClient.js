// redisClient.js
const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URI,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error", err);
});

// ✅ Make sure to export the client
module.exports = redisClient;
